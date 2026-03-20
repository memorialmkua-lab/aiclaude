---
name: typescript-patterns
description: TypeScript patterns, type modeling, runtime validation, and async architecture for building robust, maintainable frontend and backend applications.
origin: ECC
---

# TypeScript Development Patterns

Idiomatic TypeScript patterns for building robust, maintainable, and type-safe applications.

## When to Activate

- Writing new TypeScript or TSX code
- Reviewing shared models, service contracts, or public APIs
- Refactoring JavaScript modules into TypeScript
- Designing runtime validation for external input
- Modeling complex application state with unions and generics

## Core Principles

### 1. Make Invalid States Unrepresentable

Model domain rules directly in the type system so incorrect combinations are impossible.

```typescript
// Good: state is explicit and exhaustive
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

function renderState(state: LoadState<string[]>) {
  switch (state.status) {
    case 'idle':
      return 'Ready'
    case 'loading':
      return 'Loading...'
    case 'success':
      return `${state.data.length} results`
    case 'error':
      return state.message
  }
}

// Bad: unrelated booleans can drift out of sync
type BadLoadState<T> = {
  isLoading: boolean
  data?: T
  error?: string
}
```

### 2. Push `unknown` to the Boundary

Treat network payloads, storage reads, environment variables, and user input as `unknown` until validated.

```typescript
// Good: validate first, then trust
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}

// Bad: any bypasses type safety
function getErrorMessageUnsafe(error: any): string {
  return error.message
}
```

### 3. Prefer Inference Locally, Explicit Types Publicly

Let TypeScript infer simple local variables, but make exported APIs and shared contracts explicit.

```typescript
interface User {
  id: string
  email: string
}

export function formatUserEmail(user: User): string {
  const normalizedEmail = user.email.trim().toLowerCase()
  return normalizedEmail
}
```

### 4. Model Transformation Stages Separately

Keep transport DTOs, validated input, and domain models distinct when they have different guarantees.

```typescript
interface UserRecord {
  id: string
  email_address: string
  created_at: string
}

interface User {
  id: string
  email: string
  createdAt: Date
}

function toUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email_address,
    createdAt: new Date(record.created_at)
  }
}
```

## Type Modeling Patterns

### Interfaces vs. Type Aliases

- Use `interface` for object shapes that may be extended or implemented
- Use `type` for unions, intersections, mapped types, tuples, and utility types
- Prefer string literal unions over `enum` unless interop requires an `enum`

```typescript
interface Project {
  id: string
  name: string
}

type ProjectStatus = 'draft' | 'active' | 'archived'
type ProjectSummary = Project & {
  status: ProjectStatus
}
```

### Discriminated Unions

Use a discriminant field to represent mutually exclusive states.

```typescript
type PaymentMethod =
  | { kind: 'card'; last4: string }
  | { kind: 'bank'; bankName: string }

function getPaymentLabel(method: PaymentMethod): string {
  switch (method.kind) {
    case 'card':
      return `Card ending in ${method.last4}`
    case 'bank':
      return method.bankName
  }
}
```

### Exhaustive Switches with `never`

When a union grows, the compiler should force updates in every switch.

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}

function getStatusColor(status: 'draft' | 'active' | 'archived') {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'active':
      return 'green'
    case 'archived':
      return 'slate'
    default:
      return assertNever(status)
  }
}
```

### Generic Constraints

Use generics when caller input determines output shape, and add constraints when behavior depends on specific fields.

```typescript
function pluckIds<T extends { id: string }>(items: T[]): string[] {
  return items.map(item => item.id)
}

function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce<Record<K, T[]>>((groups, item) => {
    const key = getKey(item)

    return {
      ...groups,
      [key]: [...(groups[key] ?? []), item]
    }
  }, {} as Record<K, T[]>)
}
```

### `satisfies` for Config Objects

Use `satisfies` when you want shape checking without widening away useful literal types.

```typescript
type RouteConfig = {
  path: string
  requiresAuth: boolean
}

const routes = {
  home: { path: '/', requiresAuth: false },
  settings: { path: '/settings', requiresAuth: true }
} satisfies Record<string, RouteConfig>
```

## Runtime Validation Patterns

### Schema-First Validation

Use Zod or an equivalent schema library at trust boundaries and infer the TypeScript type from the schema.

```typescript
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member'])
})

type CreateUserInput = z.infer<typeof createUserSchema>

function parseCreateUserInput(input: unknown): CreateUserInput {
  return createUserSchema.parse(input)
}
```

### Type Guards for Runtime Narrowing

Use type guards when schemas are too heavy for a narrow internal check.

```typescript
interface RetryableError {
  code: string
  retryAfterMs: number
}

function isRetryableError(value: unknown): value is RetryableError {
  return (
    typeof value === 'object'
    && value !== null
    && 'code' in value
    && 'retryAfterMs' in value
    && typeof value.retryAfterMs === 'number'
  )
}
```

### Parse Early, Map Once

Validate external input once, then convert it into domain types at the edge of the system.

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production'])
})

const env = envSchema.parse(process.env)
```

## Async and Error Patterns

### Prefer `Promise.all` for Independent Work

```typescript
const [account, projects, usage] = await Promise.all([
  fetchAccount(accountId),
  fetchProjects(accountId),
  fetchUsage(accountId)
])
```

### Return Structured Results for Recoverable Failures

For domain-level failures that callers are expected to handle, prefer result unions over throwing.

```typescript
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

async function loadProject(id: string): Promise<Result<ProjectSummary>> {
  const project = await repository.findById(id)

  if (!project) {
    return { ok: false, error: 'Project not found' }
  }

  return { ok: true, value: project }
}
```

### Throw for Programmer or Infrastructure Errors

Use exceptions for unexpected failures, then log and translate them at the boundary.

```typescript
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
```

### Pass Through `AbortSignal`

Any async API that performs I/O should accept an `AbortSignal` when cancellation matters.

```typescript
interface SearchOptions {
  signal?: AbortSignal
}

async function searchUsers(query: string, options: SearchOptions = {}) {
  return fetchJson<{ users: string[] }>(
    `/api/users?query=${encodeURIComponent(query)}`,
    options.signal
  )
}
```

## Module and API Patterns

### Stable Repository Interfaces

Hide persistence details behind small interfaces so services depend on contracts, not storage choices.

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>
  create(input: CreateUserInput): Promise<User>
  update(id: string, input: Partial<CreateUserInput>): Promise<User>
}
```

### Consistent API Envelopes

Use a consistent success/error envelope for HTTP responses.

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

### Immutable Updates

Favor `Readonly` inputs and immutable outputs, especially in reducers and shared utilities.

```typescript
interface SessionState {
  selectedProjectId: string | null
  recentProjectIds: string[]
}

function selectProject(
  state: Readonly<SessionState>,
  projectId: string
): SessionState {
  return {
    ...state,
    selectedProjectId: projectId,
    recentProjectIds: [projectId, ...state.recentProjectIds.filter(id => id !== projectId)]
  }
}
```

### Avoid Leaky Barrels

- Use `index.ts` to expose a stable public surface
- Do not create barrels that re-export everything recursively
- Avoid circular imports created by broad barrels

```typescript
// feature/projects/index.ts
export { listProjects } from './list-projects'
export type { ProjectSummary } from './project-types'
```

## React and UI Patterns

For deeper UI architecture, state, and rendering guidance, pair this skill with `frontend-patterns`.

### Typed Props and Callbacks

```typescript
interface UserListProps {
  users: User[]
  onSelectUser: (userId: string) => void
}

export function UserList({ users, onSelectUser }: UserListProps) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <button onClick={() => onSelectUser(user.id)}>
            {user.email}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### Derived State Over Duplicated State

```typescript
const visibleUsers = users.filter(user => user.isActive)
```

Avoid storing `visibleUsers` separately unless recomputation is truly expensive and measured.

## Checklist

- [ ] Exported functions and shared types use explicit signatures
- [ ] External input is validated before use
- [ ] `any` is avoided or narrowly justified
- [ ] Unions are discriminated and exhaustively handled
- [ ] Async work uses `Promise.all` when tasks are independent
- [ ] State updates are immutable
- [ ] Public modules expose a small, stable API surface

## Related Skills

- `coding-standards` for cross-language readability, immutability, and general code quality
- `frontend-patterns` for React and Next.js UI architecture
- `backend-patterns` for service, API, and persistence design
- `tdd-workflow` for test-first implementation and coverage discipline
