use lazy_static::lazy_static;
use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use sysinfo::{Pid, System};

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

    fn start_scanning(&mut self, names: Vec<String>) {
        let is_scanning = self.is_scanning.clone();
        is_scanning.store(true, Ordering::SeqCst);

        thread::spawn(move || {
            let mut local_system = System::new_all();
            let mut previous_pid: Option<Pid> = None;

            while is_scanning.load(Ordering::SeqCst) {
                local_system.refresh_processes();

                let found_process = local_system.processes().iter().find_map(|(&pid, process)| {
                    let process_name = process.name().to_lowercase();
                    let process_status = process.status();
                    let process_memory = process.memory();

                    // Return the PID only if the process is healthy (when the game crashes its reported memory usage falls down below 1MB)
                    if names.iter().any(|name| {
                        name.to_lowercase() == process_name.to_lowercase()
                            && process_status == sysinfo::ProcessStatus::Run
                            && process_memory > 1024768
                    }) {
                        if previous_pid != Some(pid) {
                            // When FF7 crashes the process.cwd() returns None
                            println!("Found process PID: {} with path {:?}", pid, process.cwd());
                            previous_pid = Some(pid);
                        }
                        Some(pid)
                    } else {
                        None
                    }
                });

                if found_process.is_none() && previous_pid.is_some() {
                    println!("Game disconnected");
                    previous_pid = None;
                }

                match found_process {
                    Some(pid) => SCANNER.lock().process = Some(pid),
                    None => SCANNER.lock().process = None,
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

pub fn initialize(names: Vec<String>) {
    SCANNER.lock().start_scanning(names);
}

pub fn get_pid() -> Option<Pid> {
    let pid = SCANNER.lock().get_pid();
    return pid;
}
