use std::path::PathBuf;
use chrono::Local;
use log::{LevelFilter};
use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    timestamp: String,
    level: String,
    source: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    params: Option<serde_json::Value>,
}

pub fn setup_logging(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_log_dir = app.path().app_log_dir()
        .expect("Failed to get app log directory");
    
    std::fs::create_dir_all(&app_log_dir)?;
    
    let log_file = app_log_dir.join("ff7-ultima.log");
    
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{}|{}|{}|{}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                record.target(),
                message
            ))
        })
        .level(LevelFilter::Info)
        .chain(std::io::stdout())
        .chain(fern::log_file(&log_file)?)
        .apply()?;
    
    log::info!(target: "app::init", "Logging initialized, logging to: {}", log_file.display());
    Ok(log_file)
} 