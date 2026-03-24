use ratatui::{
    prelude::*,
    widgets::{Block, Borders, List, ListItem, Paragraph, Tabs, Wrap},
};

use crate::config::{Config, PaneLayout};
use crate::session::store::{StateStore, ToolLogEntry};
use crate::session::{Session, SessionState};

const DEFAULT_PANE_SIZE_PERCENT: u16 = 35;
const DEFAULT_GRID_SIZE_PERCENT: u16 = 50;
const OUTPUT_PANE_PERCENT: u16 = 70;
const MIN_PANE_SIZE_PERCENT: u16 = 20;
const MAX_PANE_SIZE_PERCENT: u16 = 80;
const PANE_RESIZE_STEP_PERCENT: u16 = 5;
const MAX_LOG_ENTRIES: usize = 12;

pub struct Dashboard {
    db: StateStore,
    cfg: Config,
    sessions: Vec<Session>,
    logs: Vec<ToolLogEntry>,
    selected_pane: Pane,
    selected_session: usize,
    show_help: bool,
    scroll_offset: usize,
    pane_size_percent: u16,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Pane {
    Sessions,
    Output,
    Metrics,
    Log,
}

#[derive(Debug, Clone, Copy)]
struct PaneAreas {
    sessions: Rect,
    output: Rect,
    metrics: Rect,
    log: Option<Rect>,
}

impl Dashboard {
    pub fn new(db: StateStore, cfg: Config) -> Self {
        let pane_size_percent = match cfg.pane_layout {
            PaneLayout::Grid => DEFAULT_GRID_SIZE_PERCENT,
            PaneLayout::Horizontal | PaneLayout::Vertical => DEFAULT_PANE_SIZE_PERCENT,
        };

        let sessions = db.list_sessions().unwrap_or_default();
        let mut dashboard = Self {
            db,
            cfg,
            sessions,
            logs: Vec::new(),
            selected_pane: Pane::Sessions,
            selected_session: 0,
            show_help: false,
            scroll_offset: 0,
            pane_size_percent,
        };
        dashboard.refresh_logs();
        dashboard
    }

    pub fn render(&self, frame: &mut Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Min(10),
                Constraint::Length(3),
            ])
            .split(frame.area());

        self.render_header(frame, chunks[0]);

        if self.show_help {
            self.render_help(frame, chunks[1]);
        } else {
            let pane_areas = self.pane_areas(chunks[1]);
            self.render_sessions(frame, pane_areas.sessions);
            self.render_output(frame, pane_areas.output);
            self.render_metrics(frame, pane_areas.metrics);

            if let Some(log_area) = pane_areas.log {
                self.render_log(frame, log_area);
            }
        }

        self.render_status_bar(frame, chunks[2]);
    }

    fn render_header(&self, frame: &mut Frame, area: Rect) {
        let running = self
            .sessions
            .iter()
            .filter(|session| session.state == SessionState::Running)
            .count();
        let total = self.sessions.len();
        let title = format!(
            " ECC 2.0 | {running} running / {total} total | {} {}% ",
            self.layout_label(),
            self.pane_size_percent
        );

        let tabs = Tabs::new(
            self.visible_panes()
                .iter()
                .map(|pane| pane.title())
                .collect::<Vec<_>>(),
        )
        .block(Block::default().borders(Borders::ALL).title(title))
        .select(self.selected_pane_index())
        .highlight_style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        );

        frame.render_widget(tabs, area);
    }

    fn render_sessions(&self, frame: &mut Frame, area: Rect) {
        let items: Vec<ListItem> = if self.sessions.is_empty() {
            vec![ListItem::new("No sessions. Press 'n' to start one.")]
        } else {
            self.sessions
                .iter()
                .enumerate()
                .map(|(index, session)| {
                    let state_icon = match session.state {
                        SessionState::Running => "●",
                        SessionState::Idle => "○",
                        SessionState::Completed => "✓",
                        SessionState::Failed => "✗",
                        SessionState::Stopped => "■",
                        SessionState::Pending => "◌",
                    };

                    let style = if index == self.selected_session {
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD)
                    } else {
                        Style::default()
                    };

                    let text = format!(
                        "{state_icon} {} [{}] {}",
                        &session.id[..8.min(session.id.len())],
                        session.agent_type,
                        session.task
                    );

                    ListItem::new(text).style(style)
                })
                .collect()
        };

        let list = List::new(items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Sessions ")
                .border_style(self.pane_border_style(Pane::Sessions)),
        );
        frame.render_widget(list, area);
    }

    fn render_output(&self, frame: &mut Frame, area: Rect) {
        let content = if let Some(session) = self.current_session() {
            let worktree = session
                .worktree
                .as_ref()
                .map(|worktree| {
                    format!(
                        "Worktree: {}\nBranch: {}\n",
                        worktree.path.display(),
                        worktree.branch
                    )
                })
                .unwrap_or_default();

            format!(
                "Session: {}\nAgent: {}\nState: {}\nTask: {}\nUpdated: {}\n{}\
                 \nLive streaming output is not wired yet. Session context is shown here until the stream viewer lands.",
                session.id,
                session.agent_type,
                session.state,
                session.task,
                session.updated_at.format("%Y-%m-%d %H:%M:%S UTC"),
                worktree
            )
        } else {
            "No sessions. Press 'n' to start one.".to_string()
        };

        let paragraph = Paragraph::new(content)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Output ")
                    .border_style(self.pane_border_style(Pane::Output)),
            )
            .scroll((self.scroll_offset_u16(), 0))
            .wrap(Wrap { trim: false });
        frame.render_widget(paragraph, area);
    }

    fn render_metrics(&self, frame: &mut Frame, area: Rect) {
        let content = if let Some(session) = self.current_session() {
            let metrics = &session.metrics;
            format!(
                "Tokens: {}\nTools: {}\nFiles: {}\nCost: ${:.4}\nDuration: {}s",
                metrics.tokens_used,
                metrics.tool_calls,
                metrics.files_changed,
                metrics.cost_usd,
                metrics.duration_secs
            )
        } else {
            "No metrics available".to_string()
        };

        let paragraph = Paragraph::new(content)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Metrics ")
                    .border_style(self.pane_border_style(Pane::Metrics)),
            )
            .scroll((self.scroll_offset_u16(), 0))
            .wrap(Wrap { trim: false });
        frame.render_widget(paragraph, area);
    }

    fn render_log(&self, frame: &mut Frame, area: Rect) {
        let content = if self.current_session().is_none() {
            "No session selected".to_string()
        } else if self.logs.is_empty() {
            "No tool logs available for this session.\n\nTool call observability events will appear here when they are recorded."
                .to_string()
        } else {
            self.logs
                .iter()
                .map(|entry| {
                    format!(
                        "[{}] {} | {}ms | risk {:.0}%\ninput: {}\noutput: {}",
                        self.short_timestamp(&entry.timestamp),
                        entry.tool_name,
                        entry.duration_ms,
                        entry.risk_score * 100.0,
                        self.log_field(&entry.input_summary),
                        self.log_field(&entry.output_summary)
                    )
                })
                .collect::<Vec<_>>()
                .join("\n\n")
        };

        let paragraph = Paragraph::new(content)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Log ")
                    .border_style(self.pane_border_style(Pane::Log)),
            )
            .scroll((self.scroll_offset_u16(), 0))
            .wrap(Wrap { trim: false });
        frame.render_widget(paragraph, area);
    }

    fn render_status_bar(&self, frame: &mut Frame, area: Rect) {
        let text = format!(
            " [n]ew session  [s]top  [Tab] switch pane  [j/k] scroll  [+/-] resize  [{}] layout  [?] help  [q]uit ",
            self.layout_label()
        );

        let paragraph = Paragraph::new(text)
            .style(Style::default().fg(Color::DarkGray))
            .block(Block::default().borders(Borders::ALL));
        frame.render_widget(paragraph, area);
    }

    fn render_help(&self, frame: &mut Frame, area: Rect) {
        let help = vec![
            "Keyboard Shortcuts:",
            "",
            "  n       New session",
            "  s       Stop selected session",
            "  Tab     Next pane",
            "  S-Tab   Previous pane",
            "  j/↓     Scroll down",
            "  k/↑     Scroll up",
            "  +/=     Increase pane size",
            "  -       Decrease pane size",
            "  r       Refresh",
            "  ?       Toggle help",
            "  q/C-c   Quit",
        ];

        let paragraph = Paragraph::new(help.join("\n")).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Help ")
                .border_style(Style::default().fg(Color::Yellow)),
        );
        frame.render_widget(paragraph, area);
    }

    pub fn next_pane(&mut self) {
        let visible_panes = self.visible_panes();
        let next_index = self
            .selected_pane_index()
            .checked_add(1)
            .map(|index| index % visible_panes.len())
            .unwrap_or(0);

        self.selected_pane = visible_panes[next_index];
        self.scroll_offset = 0;
    }

    pub fn prev_pane(&mut self) {
        let visible_panes = self.visible_panes();
        let previous_index = if self.selected_pane_index() == 0 {
            visible_panes.len() - 1
        } else {
            self.selected_pane_index() - 1
        };

        self.selected_pane = visible_panes[previous_index];
        self.scroll_offset = 0;
    }

    pub fn increase_pane_size(&mut self) {
        self.pane_size_percent =
            (self.pane_size_percent + PANE_RESIZE_STEP_PERCENT).min(MAX_PANE_SIZE_PERCENT);
    }

    pub fn decrease_pane_size(&mut self) {
        self.pane_size_percent = self
            .pane_size_percent
            .saturating_sub(PANE_RESIZE_STEP_PERCENT)
            .max(MIN_PANE_SIZE_PERCENT);
    }

    pub fn scroll_down(&mut self) {
        if self.selected_pane == Pane::Sessions && !self.sessions.is_empty() {
            self.selected_session = (self.selected_session + 1).min(self.sessions.len() - 1);
            self.scroll_offset = 0;
            self.refresh_logs();
        } else {
            self.scroll_offset = self.scroll_offset.saturating_add(1);
        }
    }

    pub fn scroll_up(&mut self) {
        if self.selected_pane == Pane::Sessions {
            let previous_index = self.selected_session;
            self.selected_session = self.selected_session.saturating_sub(1);

            if self.selected_session != previous_index {
                self.scroll_offset = 0;
                self.refresh_logs();
            }
        } else {
            self.scroll_offset = self.scroll_offset.saturating_sub(1);
        }
    }

    pub fn new_session(&mut self) {
        tracing::info!("New session dialog requested");
    }

    pub fn stop_selected(&mut self) {
        if let Some(session) = self.sessions.get(self.selected_session) {
            let _ = self.db.update_state(&session.id, &SessionState::Stopped);
            self.refresh();
        }
    }

    pub fn refresh(&mut self) {
        self.sync_from_store();
    }

    pub fn toggle_help(&mut self) {
        self.show_help = !self.show_help;
    }

    pub async fn tick(&mut self) {
        self.sync_from_store();
    }

    fn sync_from_store(&mut self) {
        self.sessions = self.db.list_sessions().unwrap_or_default();
        self.clamp_selected_session();
        self.ensure_selected_pane_visible();
        self.refresh_logs();
    }

    fn current_session(&self) -> Option<&Session> {
        self.sessions.get(self.selected_session)
    }

    fn refresh_logs(&mut self) {
        let session_id = self.current_session().map(|session| session.id.clone());

        self.logs = session_id
            .and_then(|id| self.db.list_tool_logs(&id, MAX_LOG_ENTRIES).ok())
            .unwrap_or_default();
    }

    fn clamp_selected_session(&mut self) {
        if self.sessions.is_empty() {
            self.selected_session = 0;
            return;
        }

        self.selected_session = self.selected_session.min(self.sessions.len() - 1);
    }

    fn ensure_selected_pane_visible(&mut self) {
        if !self.visible_panes().contains(&self.selected_pane) {
            self.selected_pane = Pane::Sessions;
        }
    }

    fn pane_areas(&self, area: Rect) -> PaneAreas {
        match self.cfg.pane_layout {
            PaneLayout::Horizontal => {
                let columns = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints(self.primary_constraints())
                    .split(area);
                let right_rows = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([
                        Constraint::Percentage(OUTPUT_PANE_PERCENT),
                        Constraint::Percentage(100 - OUTPUT_PANE_PERCENT),
                    ])
                    .split(columns[1]);

                PaneAreas {
                    sessions: columns[0],
                    output: right_rows[0],
                    metrics: right_rows[1],
                    log: None,
                }
            }
            PaneLayout::Vertical => {
                let rows = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints(self.primary_constraints())
                    .split(area);
                let bottom_columns = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints([
                        Constraint::Percentage(OUTPUT_PANE_PERCENT),
                        Constraint::Percentage(100 - OUTPUT_PANE_PERCENT),
                    ])
                    .split(rows[1]);

                PaneAreas {
                    sessions: rows[0],
                    output: bottom_columns[0],
                    metrics: bottom_columns[1],
                    log: None,
                }
            }
            PaneLayout::Grid => {
                let rows = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints(self.primary_constraints())
                    .split(area);
                let top_columns = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints(self.primary_constraints())
                    .split(rows[0]);
                let bottom_columns = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints(self.primary_constraints())
                    .split(rows[1]);

                PaneAreas {
                    sessions: top_columns[0],
                    output: top_columns[1],
                    metrics: bottom_columns[0],
                    log: Some(bottom_columns[1]),
                }
            }
        }
    }

    fn primary_constraints(&self) -> [Constraint; 2] {
        [
            Constraint::Percentage(self.pane_size_percent),
            Constraint::Percentage(100 - self.pane_size_percent),
        ]
    }

    fn visible_panes(&self) -> &'static [Pane] {
        match self.cfg.pane_layout {
            PaneLayout::Grid => &[Pane::Sessions, Pane::Output, Pane::Metrics, Pane::Log],
            PaneLayout::Horizontal | PaneLayout::Vertical => {
                &[Pane::Sessions, Pane::Output, Pane::Metrics]
            }
        }
    }

    fn selected_pane_index(&self) -> usize {
        self.visible_panes()
            .iter()
            .position(|pane| *pane == self.selected_pane)
            .unwrap_or(0)
    }

    fn pane_border_style(&self, pane: Pane) -> Style {
        if self.selected_pane == pane {
            Style::default().fg(Color::Cyan)
        } else {
            Style::default()
        }
    }

    fn layout_label(&self) -> &'static str {
        match self.cfg.pane_layout {
            PaneLayout::Horizontal => "horizontal",
            PaneLayout::Vertical => "vertical",
            PaneLayout::Grid => "grid",
        }
    }

    fn scroll_offset_u16(&self) -> u16 {
        self.scroll_offset.min(u16::MAX as usize) as u16
    }

    fn log_field<'a>(&self, value: &'a str) -> &'a str {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            "n/a"
        } else {
            trimmed
        }
    }

    fn short_timestamp(&self, timestamp: &str) -> String {
        chrono::DateTime::parse_from_rfc3339(timestamp)
            .map(|value| value.format("%H:%M:%S").to_string())
            .unwrap_or_else(|_| timestamp.to_string())
    }
}

impl Pane {
    fn title(self) -> &'static str {
        match self {
            Pane::Sessions => "Sessions",
            Pane::Output => "Output",
            Pane::Metrics => "Metrics",
            Pane::Log => "Log",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        Dashboard, Pane, DEFAULT_GRID_SIZE_PERCENT, MAX_PANE_SIZE_PERCENT, MIN_PANE_SIZE_PERCENT,
    };
    use crate::config::{Config, PaneLayout};
    use crate::session::store::StateStore;
    use ratatui::layout::Rect;

    fn dashboard_for(layout: PaneLayout) -> Dashboard {
        let mut cfg = Config::default();
        cfg.pane_layout = layout;

        let db_path =
            std::env::temp_dir().join(format!("ecc-dashboard-test-{}.db", uuid::Uuid::new_v4()));
        let db = StateStore::open(&db_path).unwrap();

        Dashboard::new(db, cfg)
    }

    #[test]
    fn grid_layout_uses_four_panes_in_two_rows() {
        let dashboard = dashboard_for(PaneLayout::Grid);
        let areas = dashboard.pane_areas(Rect::new(0, 0, 100, 40));
        let log_area = areas.log.expect("grid layout should render a log pane");

        assert_eq!(areas.sessions.y, areas.output.y);
        assert_eq!(areas.metrics.y, log_area.y);
        assert!(areas.metrics.y > areas.sessions.y);
        assert_eq!(areas.sessions.x, 0);
        assert_eq!(areas.metrics.x, 0);
        assert!(areas.output.x > areas.sessions.x);
        assert!(log_area.x > areas.metrics.x);
    }

    #[test]
    fn non_grid_layouts_hide_the_log_pane() {
        let horizontal = dashboard_for(PaneLayout::Horizontal);
        let vertical = dashboard_for(PaneLayout::Vertical);

        assert!(horizontal
            .pane_areas(Rect::new(0, 0, 100, 40))
            .log
            .is_none());
        assert!(vertical.pane_areas(Rect::new(0, 0, 100, 40)).log.is_none());
    }

    #[test]
    fn pane_navigation_includes_log_only_for_grid_layouts() {
        let mut horizontal = dashboard_for(PaneLayout::Horizontal);
        horizontal.next_pane();
        horizontal.next_pane();
        horizontal.next_pane();
        assert_eq!(horizontal.selected_pane, Pane::Sessions);

        let mut grid = dashboard_for(PaneLayout::Grid);
        grid.next_pane();
        grid.next_pane();
        grid.next_pane();
        assert_eq!(grid.selected_pane, Pane::Log);
    }

    #[test]
    fn pane_resize_clamps_to_supported_bounds() {
        let mut dashboard = dashboard_for(PaneLayout::Grid);
        assert_eq!(dashboard.pane_size_percent, DEFAULT_GRID_SIZE_PERCENT);

        for _ in 0..20 {
            dashboard.increase_pane_size();
        }
        assert_eq!(dashboard.pane_size_percent, MAX_PANE_SIZE_PERCENT);

        for _ in 0..40 {
            dashboard.decrease_pane_size();
        }
        assert_eq!(dashboard.pane_size_percent, MIN_PANE_SIZE_PERCENT);
    }
}
