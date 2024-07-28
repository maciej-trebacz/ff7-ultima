use std::time::Duration;
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use sysinfo::{System, Pid};
use lazy_static::lazy_static;
use parking_lot::Mutex;

struct FF7ProcessScanner {
    process: Option<Pid>,
    is_scanning: Arc<AtomicBool>,
}

impl FF7ProcessScanner {
    fn new() -> Self {
        FF7ProcessScanner {
            process: None,
            is_scanning: Arc::new(AtomicBool::new(false)),
        }
    }

    fn start_scanning(&mut self) {
        let is_scanning = self.is_scanning.clone();
        is_scanning.store(true, Ordering::SeqCst);

        thread::spawn(move || {
            let mut local_system = System::new_all();
            while is_scanning.load(Ordering::SeqCst) {
                local_system.refresh_processes();

                if let Some((&pid, _)) = local_system.processes().iter().find(|(_, process)| process.name() == "ff7_en.exe") {
                    SCANNER.lock().process = Some(pid);
                    // println!("Found ff7_en.exe process with PID: {}", pid);
                } else {
                    SCANNER.lock().process = None;
                    // println!("No ff7_en.exe process found");
                }

                thread::sleep(Duration::from_millis(200));
            }
        });
    }

    fn get_pid(&self) -> Option<Pid> {
        self.process
    }

    // fn is_scanning(&self) -> bool {
    //     self.is_scanning.load(Ordering::SeqCst)
    // }
}

lazy_static! {
    static ref SCANNER: Mutex<FF7ProcessScanner> = Mutex::new(FF7ProcessScanner::new());
}

pub fn initialize() {
    SCANNER.lock().start_scanning();
}

pub fn get_pid() -> Option<Pid> {
    SCANNER.lock().get_pid()
}

// pub fn is_scanning() -> bool {
//     SCANNER.lock().is_scanning()
// }