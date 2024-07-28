use std::time::Duration;
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use sysinfo::{System, Pid};
use lazy_static::lazy_static;
use parking_lot::Mutex;

struct ProcessScanner {
    process: Option<Pid>,
    is_scanning: Arc<AtomicBool>,
}

impl ProcessScanner {
    fn new() -> Self {
        ProcessScanner {
            process: None,
            is_scanning: Arc::new(AtomicBool::new(false)),
        }
    }

    fn start_scanning(&mut self, name: &str) {
        let is_scanning = self.is_scanning.clone();
        is_scanning.store(true, Ordering::SeqCst);
        let name = name.to_string();

        thread::spawn(move || {
            let mut local_system = System::new_all();
            while is_scanning.load(Ordering::SeqCst) {
                local_system.refresh_processes();

                if let Some((&pid, _)) = local_system.processes().iter().find(|(_, process)| process.name() == name) {
                    SCANNER.lock().process = Some(pid);
                } else {
                    SCANNER.lock().process = None;
                }

                thread::sleep(Duration::from_millis(200));
            }
        });
    }

    fn get_pid(&self) -> Option<Pid> {
        self.process
    }
}

lazy_static! {
    static ref SCANNER: Mutex<ProcessScanner> = Mutex::new(ProcessScanner::new());
}

pub fn initialize(name: &str) {
    SCANNER.lock().start_scanning(name);
}

pub fn get_pid() -> Option<Pid> {
    SCANNER.lock().get_pid()
}