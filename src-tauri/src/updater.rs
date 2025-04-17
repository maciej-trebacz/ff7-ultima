use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub date: Option<String>,
    pub body: Option<String>,
}

pub async fn check_updates(app: AppHandle) -> tauri_plugin_updater::Result<Option<UpdateInfo>> {
    if let Some(update) = app.updater()?.check().await? {
        println!("[Updater] update to version {} date {:?}", update.version, update.date);
        Ok(Some(UpdateInfo {
            version: update.version.clone(),
            date: update.date.map(|d| d.to_string()),
            body: update.body.clone(),
        }))
    } else {
        Ok(None)
    }
}

pub async fn perform_update(app: AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;
        let version = update.version.clone();

        println!("[Updater] update to version {version} available, downloading...");

        update
            .download_and_install(
                |chunk_length, _content_length| {
                    downloaded += chunk_length;
                },
                || {
                    println!("[Updater] download finished");
                },
            )
            .await?;

        println!("[Updater] update installed");
        app.restart();
    } else {
        println!("[Updater] no update available");
    }

    Ok(())
}
