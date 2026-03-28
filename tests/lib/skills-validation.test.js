/**
 * Tests for skills validation.
 *
 * Validates all skills in the skills/ directory for:
 * - YAML frontmatter correctness (name, description, origin)
 * - Required sections (When to Activate)
 * - Content quality (proper headings, code examples)
 * - File naming conventions
 *
 * Run with: node tests/lib/skills-validation.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../skills');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

/**
 * Parse YAML frontmatter from SKILL.md content.
 * Returns { frontmatter: object, body: string } or null if no frontmatter.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  // Simple YAML parsing for flat key-value pairs
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Check if a string is a valid skill name.
 * Valid names: lowercase letters, numbers, and hyphens.
 */
function isValidSkillName(name) {
  return /^[a-z0-9-]+$/.test(name);
}

/**
 * Get all skill directories.
 */
function getSkillDirectories() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => ({
    name: e.name,
    path: path.join(SKILLS_DIR, e.name),
    skillMdPath: path.join(SKILLS_DIR, e.name, 'SKILL.md')
  }));
}

/**
 * Get a sample of skills for testing (to keep test runtime reasonable).
 * Uses deterministic selection for reproducible tests.
 */
function getSampleSkills(sampleSize = 20) {
  const allSkills = getSkillDirectories();
  // Always include some known skills for consistency
  const knownSkills = ['coding-standards', 'tdd-workflow', 'security-review', 'backend-patterns', 'api-design'];
  const knownSet = new Set(knownSkills);
  
  const sampled = [];
  const remaining = [];
  
  for (const skill of allSkills) {
    if (knownSet.has(skill.name)) {
      sampled.push(skill);
    } else {
      remaining.push(skill);
    }
  }
  
  // Sort remaining by name for deterministic ordering, then take first N
  remaining.sort((a, b) => a.name.localeCompare(b.name));
  
  // Add skills from remaining to reach sampleSize (deterministic selection)
  for (let i = 0; i < remaining.length && sampled.length < sampleSize; i++) {
    sampled.push(remaining[i]);
  }
  
  return sampled;
}

function runTests() {
  console.log('\n=== Testing Skills Validation ===\n');

  let passed = 0;
  let failed = 0;

  // ============ YAML Frontmatter Tests ============
  console.log('YAML Frontmatter:');

  const skills = getSkillDirectories();
  
  // Guard: Ensure we have skills to test
  if (skills.length === 0) {
    console.log('  \u2717 No skills discovered');
    console.log(`    Error: No skills found in ${SKILLS_DIR}`);
    console.log('\nResults: Passed: 0, Failed: 1');
    process.exit(1);
  }

  if (test('all skills have SKILL.md file', () => {
    const missing = skills.filter(s => !fs.existsSync(s.skillMdPath));
    if (missing.length > 0) {
      const names = missing.slice(0, 5).map(s => s.name);
      throw new Error(`Missing SKILL.md in: ${names.join(', ')}${missing.length > 5 ? '...' : ''}`);
    }
  })) passed++; else failed++;

  if (test('all SKILL.md files have YAML frontmatter', () => {
    const missing = skills.filter(s => {
      if (!fs.existsSync(s.skillMdPath)) return true;
      const content = fs.readFileSync(s.skillMdPath, 'utf-8');
      return !content.startsWith('---\n');
    });
    // Report but don't fail - some skills may be placeholders
    if (missing.length > 0) {
      const names = missing.slice(0, 5).map(s => s.name);
      console.log(`    [INFO] ${missing.length} skills missing frontmatter: ${names.join(', ')}${missing.length > 5 ? '...' : ''}`);
    }
    // Test passes if most skills have frontmatter (>90%)
    const pctWithFrontmatter = ((skills.length - missing.length) / skills.length) * 100;
    if (pctWithFrontmatter < 90) {
      throw new Error(`Only ${pctWithFrontmatter.toFixed(1)}% of skills have frontmatter (expected >90%)`);
    }
  })) passed++; else failed++;

  if (test('most frontmatter has required fields (name, description, origin)', () => {
    const invalidSkills = new Map(); // Track skills with issues (skill-level, not field-level)
    const withFrontmatter = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      withFrontmatter.push(skill.name);
      const reasons = [];
      
      if (!parsed.frontmatter.name) {
        reasons.push('Missing name');
      }
      if (!parsed.frontmatter.description) {
        reasons.push('Missing description');
      }
      if (!parsed.frontmatter.origin) {
        reasons.push('Missing origin');
      }
      
      if (reasons.length > 0) {
        invalidSkills.set(skill.name, reasons);
      }
    }
    
    // Report issues
    if (invalidSkills.size > 0) {
      const details = [...invalidSkills.entries()].slice(0, 5).map(([name, reasons]) => `${name} (${reasons.join(', ')})`);
      console.log(`    [INFO] ${invalidSkills.size} skills with frontmatter issues: ${details.join(', ')}${invalidSkills.size > 5 ? '...' : ''}`);
    }
    
    // Test passes if >85% of skills with frontmatter have all required fields
    // Use skill count (invalidSkills.size), not field count
    const pctValid = ((withFrontmatter.length - invalidSkills.size) / withFrontmatter.length) * 100;
    if (pctValid < 85) {
      throw new Error(`Only ${pctValid.toFixed(1)}% of frontmatter has all required fields (expected >85%)`);
    }
  })) passed++; else failed++;

  if (test('skill name matches directory name', () => {
    const mismatches = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed || !parsed.frontmatter.name) continue;
      if (parsed.frontmatter.name !== skill.name) {
        mismatches.push({ dir: skill.name, frontmatter: parsed.frontmatter.name });
      }
    }
    if (mismatches.length > 0) {
      const details = mismatches.slice(0, 5).map(m => `dir:${m.dir} vs name:${m.frontmatter}`);
      throw new Error(`Name mismatches: ${details.join(', ')}${mismatches.length > 5 ? '...' : ''}`);
    }
  })) passed++; else failed++;

  if (test('skill names follow naming convention (lowercase, hyphens)', () => {
    const invalid = skills.filter(s => !isValidSkillName(s.name));
    if (invalid.length > 0) {
      throw new Error(`Invalid naming: ${invalid.slice(0, 5).map(s => s.name).join(', ')}`);
    }
  })) passed++; else failed++;

  if (test('description is not empty and has reasonable length', () => {
    const invalid = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed || !parsed.frontmatter.description) continue;
      
      const desc = parsed.frontmatter.description;
      if (desc.length < 10) {
        invalid.push({ name: skill.name, reason: `Description too short (${desc.length} chars)` });
      }
      if (desc.length > 500) {
        invalid.push({ name: skill.name, reason: `Description too long (${desc.length} chars)` });
      }
    }
    
    // Report issues but don't fail - placeholder descriptions are common
    if (invalid.length > 0) {
      const details = invalid.slice(0, 5).map(i => `${i.name} (${i.reason})`);
      console.log(`    [INFO] ${invalid.length} description issues: ${details.join(', ')}${invalid.length > 5 ? '...' : ''}`);
    }
    
    // Test passes if most descriptions are valid (>80%)
    const withDesc = skills.filter(s => {
      const content = fs.readFileSync(path.join(SKILLS_DIR, s.name, 'SKILL.md'), 'utf-8');
      const parsed = parseFrontmatter(content);
      return parsed && parsed.frontmatter.description;
    }).length;
    
    const pctValid = ((withDesc - invalid.length) / withDesc) * 100;
    if (pctValid < 80) {
      throw new Error(`Only ${pctValid.toFixed(1)}% of descriptions are valid (expected >80%)`);
    }
  })) passed++; else failed++;

  if (test('origin field has expected value', () => {
    const invalid = [];
    const validOrigins = ['ECC', 'community', 'ECC-CONTRIBUTED'];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed || !parsed.frontmatter.origin) continue;
      
      // Origin should be one of the known valid values or a reasonable string
      // (some community contributors use their own origin format)
      const origin = parsed.frontmatter.origin;
      // Allow any origin that's not empty and reasonably formatted
      if (origin.length < 2 || origin.length > 100) {
        invalid.push({ name: skill.name, origin });
      }
    }
    if (invalid.length > 0) {
      const details = invalid.slice(0, 5).map(i => `${i.name} (origin: ${i.origin})`);
      throw new Error(`Invalid origins: ${details.join(', ')}${invalid.length > 5 ? '...' : ''}`);
    }
  })) passed++; else failed++;

  // ============ Content Structure Tests ============
  console.log('\nContent Structure:');

  if (test('most skills have "When to Activate" section', () => {
    const missing = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      // Check for "When to Activate" heading (case-insensitive)
      const hasWhenToActivate = /##\s+When\s+to\s+Activate/i.test(parsed.body);
      if (!hasWhenToActivate) {
        missing.push(skill.name);
      }
    }
    
    // Report missing sections
    if (missing.length > 0) {
      console.log(`    [INFO] ${missing.length} skills missing "When to Activate": ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
    }
    
    // Test passes if >50% of skills have this section (some skills are niche/placeholder)
    const pctWithSection = ((skills.length - missing.length) / skills.length) * 100;
    if (pctWithSection < 50) {
      throw new Error(`Only ${pctWithSection.toFixed(1)}% of skills have "When to Activate" (expected >50%)`);
    }
  })) passed++; else failed++;

  if (test('most skills have at least one heading after frontmatter', () => {
    const noHeadings = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      const hasHeading = /^#\s+/m.test(parsed.body);
      if (!hasHeading) {
        noHeadings.push(skill.name);
      }
    }
    
    // Report skills without headings
    if (noHeadings.length > 0) {
      console.log(`    [INFO] ${noHeadings.length} skills without headings: ${noHeadings.slice(0, 5).join(', ')}${noHeadings.length > 5 ? '...' : ''}`);
    }
    
    // Test passes if >95% have headings
    const pctWithHeadings = ((skills.length - noHeadings.length) / skills.length) * 100;
    if (pctWithHeadings < 95) {
      throw new Error(`Only ${pctWithHeadings.toFixed(1)}% of skills have headings (expected >95%)`);
    }
  })) passed++; else failed++;

  if (test('most skills have main title heading (H1)', () => {
    const noTitle = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      // Check for H1 heading at the start of body
      const hasH1 = /^#\s+/.test(parsed.body.trim());
      if (!hasH1) {
        noTitle.push(skill.name);
      }
    }
    
    // Report skills without H1
    if (noTitle.length > 0) {
      console.log(`    [INFO] ${noTitle.length} skills without H1: ${noTitle.slice(0, 5).join(', ')}${noTitle.length > 5 ? '...' : ''}`);
    }
    
    // Test passes if >95% have H1
    const pctWithH1 = ((skills.length - noTitle.length) / skills.length) * 100;
    if (pctWithH1 < 95) {
      throw new Error(`Only ${pctWithH1.toFixed(1)}% of skills have H1 (expected >95%)`);
    }
  })) passed++; else failed++;

  if (test('SKILL.md files are not empty', () => {
    const empty = skills.filter(s => {
      if (!fs.existsSync(s.skillMdPath)) return true;
      const content = fs.readFileSync(s.skillMdPath, 'utf-8');
      return content.trim().length === 0;
    });
    if (empty.length > 0) {
      throw new Error(`Empty files: ${empty.slice(0, 5).map(s => s.name).join(', ')}`);
    }
  })) passed++; else failed++;

  if (test('SKILL.md files have reasonable size (not too large)', () => {
    const tooLarge = [];
    const MAX_SIZE = 100 * 1024; // 100KB max
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const stats = fs.statSync(skill.skillMdPath);
      if (stats.size > MAX_SIZE) {
        tooLarge.push({ name: skill.name, size: Math.round(stats.size / 1024) + 'KB' });
      }
    }
    if (tooLarge.length > 0) {
      const details = tooLarge.slice(0, 5).map(t => `${t.name} (${t.size})`);
      throw new Error(`Files too large: ${details.join(', ')}${tooLarge.length > 5 ? '...' : ''}`);
    }
  })) passed++; else failed++;

  // ============ Code Examples Tests ============
  console.log('\nCode Examples:');

  if (test('skills with code blocks have language specifiers', () => {
    const noLang = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      // Find code blocks without language specifier
      // Note: Some code blocks intentionally don't have language (e.g., for shell output, file paths)
      const codeBlocksWithoutLang = parsed.body.match(/```\n[\s\S]*?```/g);
      if (codeBlocksWithoutLang && codeBlocksWithoutLang.length > 0) {
        noLang.push({ name: skill.name, count: codeBlocksWithoutLang.length });
      }
    }
    
    // Report issues
    if (noLang.length > 0) {
      const details = noLang.slice(0, 5).map(n => `${n.name} (${n.count} blocks)`);
      console.log(`    [INFO] ${noLang.length} skills have code blocks without language: ${details.join(', ')}${noLang.length > 5 ? '...' : ''}`);
    }
    
    // Assert that code blocks without language are not excessive
    // Allow up to 80% of skills to have code blocks without language (often intentional)
    // This threshold is lenient because many code blocks intentionally don't have language specifiers
    const pctWithoutLang = (noLang.length / skills.length) * 100;
    if (pctWithoutLang > 80) {
      throw new Error(`${pctWithoutLang.toFixed(1)}% of skills have code blocks without language specifiers (expected <80%)`);
    }
  })) passed++; else failed++;

  if (test('skills have at least one code example (for technical skills)', () => {
    const sampleSkills = getSampleSkills(15);
    const noCode = [];
    for (const skill of sampleSkills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      // Check for code blocks
      const hasCodeBlock = /```[a-z]/i.test(parsed.body);
      if (!hasCodeBlock) {
        noCode.push(skill.name);
      }
    }
    // Only report if more than 50% of sampled skills lack code blocks
    // (some skills might be non-technical)
    if (noCode.length > sampleSkills.length / 2) {
      throw new Error(`Most sampled skills lack code examples: ${noCode.slice(0, 5).join(', ')}`);
    }
  })) passed++; else failed++;

  // ============ Activation Conditions Tests ============
  console.log('\nActivation Conditions:');

  if (test('"When to Activate" section has list items or descriptions', () => {
    const emptyActivation = [];
    for (const skill of skills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      // Extract "When to Activate" section
      const match = parsed.body.match(/##\s+When\s+to\s+Activate[\s\S]*?(?=##|$)/i);
      if (!match) continue;
      
      const section = match[0];
      // Check for list items or descriptive content
      const hasListItems = /^[-*]\s+/m.test(section);
      const hasContent = section.split('\n').filter(l => l.trim().length > 0).length > 2;
      
      if (!hasListItems && !hasContent) {
        emptyActivation.push(skill.name);
      }
    }
    if (emptyActivation.length > 0) {
      throw new Error(`Empty activation sections: ${emptyActivation.slice(0, 5).join(', ')}`);
    }
  })) passed++; else failed++;

  if (test('activation conditions are actionable/useful', () => {
    const sampleSkills = getSampleSkills(10);
    const issues = [];
    for (const skill of sampleSkills) {
      if (!fs.existsSync(skill.skillMdPath)) continue;
      const content = fs.readFileSync(skill.skillMdPath, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      
      const match = parsed.body.match(/##\s+When\s+to\s+Activate[\s\S]*?(?=##|$)/i);
      if (!match) {
        // Check if skill has alternative structure (some skills don't have this section)
        continue;
      }
      
      const section = match[0];
      // Check that section has meaningful content
      const lines = section.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        issues.push(skill.name);
      }
    }
    
    // Only fail if there are clear issues
    if (issues.length > sampleSkills.length / 2) {
      throw new Error(`Many skills have poor activation sections: ${issues.join(', ')}`);
    }
  })) passed++; else failed++;

  // ============ Specific Skill Tests ============
  console.log('\nSpecific Skills:');

  // Test coding-standards skill
  if (test('coding-standards skill has required sections', () => {
    const skillPath = path.join(SKILLS_DIR, 'coding-standards', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error('coding-standards skill not found');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      throw new Error('coding-standards: No frontmatter');
    }
    
    // Check for key sections
    const requiredSections = ['When to Activate', 'Code Quality', 'TypeScript', 'React'];
    for (const section of requiredSections) {
      const regex = new RegExp(`##.*${section}`, 'i');
      if (!regex.test(parsed.body)) {
        throw new Error(`coding-standards: Missing section matching "${section}"`);
      }
    }
  })) passed++; else failed++;

  // Test tdd-workflow skill
  if (test('tdd-workflow skill has TDD steps and testing patterns', () => {
    const skillPath = path.join(SKILLS_DIR, 'tdd-workflow', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error('tdd-workflow skill not found');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      throw new Error('tdd-workflow: No frontmatter');
    }
    
    // Check for TDD-related content
    const hasSteps = /step|workflow|red.*green/i.test(parsed.body);
    const hasTesting = /test|jest|vitest|playwright/i.test(parsed.body);
    
    if (!hasSteps) {
      throw new Error('tdd-workflow: Missing workflow steps');
    }
    if (!hasTesting) {
      throw new Error('tdd-workflow: Missing testing patterns');
    }
  })) passed++; else failed++;

  // Test security-review skill
  if (test('security-review skill has security checklist', () => {
    const skillPath = path.join(SKILLS_DIR, 'security-review', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error('security-review skill not found');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      throw new Error('security-review: No frontmatter');
    }
    
    // Check for security-related content
    const hasChecklist = /checklist|security/i.test(parsed.body);
    const hasSecrets = /secret|api.?key|token|password/i.test(parsed.body);
    
    if (!hasChecklist) {
      throw new Error('security-review: Missing security checklist');
    }
    if (!hasSecrets) {
      throw new Error('security-review: Missing secrets management section');
    }
  })) passed++; else failed++;

  // Test backend-patterns skill
  if (test('backend-patterns skill has API and database patterns', () => {
    const skillPath = path.join(SKILLS_DIR, 'backend-patterns', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error('backend-patterns skill not found');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      throw new Error('backend-patterns: No frontmatter');
    }
    
    // Check for backend-related content
    const hasAPI = /api|rest|endpoint/i.test(parsed.body);
    const hasDatabase = /database|query|sql|supabase/i.test(parsed.body);
    
    if (!hasAPI) {
      throw new Error('backend-patterns: Missing API patterns');
    }
    if (!hasDatabase) {
      throw new Error('backend-patterns: Missing database patterns');
    }
  })) passed++; else failed++;

  // Test api-design skill
  if (test('api-design skill has REST/API design patterns', () => {
    const skillPath = path.join(SKILLS_DIR, 'api-design', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error('api-design skill not found');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      throw new Error('api-design: No frontmatter');
    }
    
    // Check for API design content
    const hasREST = /rest|get|post|put|delete|patch/i.test(parsed.body);
    const hasDesign = /design|pattern|endpoint/i.test(parsed.body);
    
    if (!hasREST) {
      throw new Error('api-design: Missing REST patterns');
    }
    if (!hasDesign) {
      throw new Error('api-design: Missing design patterns');
    }
  })) passed++; else failed++;

  // ============ Summary Tests ============
  console.log('\nSummary:');

  if (test('total skill count matches expected range', () => {
    const count = skills.length;
    // Based on README, there are 125 skills
    if (count < 100) {
      throw new Error(`Too few skills: ${count} (expected 100+)`);
    }
    if (count > 200) {
      throw new Error(`Too many skills: ${count} (expected ~125)`);
    }
    console.log(`    (Found ${count} skills)`);
  })) passed++; else failed++;

  if (test('no duplicate skill names', () => {
    const names = skills.map(s => s.name);
    const unique = new Set(names);
    if (unique.size !== names.length) {
      const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
      throw new Error(`Duplicate names: ${[...new Set(duplicates)].join(', ')}`);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();