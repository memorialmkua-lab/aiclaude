use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaneLayout {
    #[default]
    Horizontal,
    Vertical,
    Grid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    pub db_path: PathBuf,
    pub worktree_root: PathBuf,
    pub max_parallel_sessions: usize,
    pub max_parallel_worktrees: usize,
    pub session_timeout_secs: u64,
    pub heartbeat_interval_secs: u64,
    pub default_agent: String,
    pub theme: Theme,
    pub pane_layout: PaneLayout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Dark,
    Light,
}

impl Default for Config {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        Self {
            db_path: home.join(".claude").join("ecc2.db"),
            worktree_root: PathBuf::from("/tmp/ecc-worktrees"),
            max_parallel_sessions: 8,
            max_parallel_worktrees: 6,
            session_timeout_secs: 3600,
            heartbeat_interval_secs: 30,
            default_agent: "claude".to_string(),
            theme: Theme::Dark,
            pane_layout: PaneLayout::Horizontal,
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        let config_path = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".claude")
            .join("ecc2.toml");

        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)?;
            let config: Config = toml::from_str(&content)?;
            Ok(config)
        } else {
            Ok(Config::default())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Config, PaneLayout};

    #[test]
    fn default_config_uses_horizontal_pane_layout() {
        assert_eq!(Config::default().pane_layout, PaneLayout::Horizontal);
    }

    #[test]
    fn missing_pane_layout_deserializes_to_default() {
        let cfg: Config = toml::from_str(r#"default_agent = "codex""#).unwrap();

        assert_eq!(cfg.pane_layout, PaneLayout::Horizontal);
        assert_eq!(cfg.default_agent, "codex");
    }

    #[test]
    fn pane_layout_deserializes_from_toml() {
        let cfg: Config = toml::from_str(r#"pane_layout = "grid""#).unwrap();

        assert_eq!(cfg.pane_layout, PaneLayout::Grid);
    }
}
