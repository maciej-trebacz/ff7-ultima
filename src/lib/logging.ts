import { invoke } from '@tauri-apps/api/core';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
type LogParams = Record<string, any>;

class Logger {
    private static instance: Logger;
    
    private constructor() {}
    
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    private async log(level: LogLevel, message: string, params?: LogParams) {
        // Log to console
        const consoleMethod = level === 'error' ? 'error' 
            : level === 'warn' ? 'warn' 
            : 'log';
            
        const timestamp = new Date().toISOString();
        const consoleMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (params) {
            console[consoleMethod](consoleMessage, params);
        } else {
            console[consoleMethod](consoleMessage);
        }
        
        // Log to backend
        try {
            await invoke('log_from_frontend', {
                level,
                message,
                params: params || null
            });
        } catch (error) {
            console.error('Failed to send log to backend:', error);
        }
    }
    
    public error(message: string, params?: LogParams) {
        return this.log('error', message, params);
    }
    
    public warn(message: string, params?: LogParams) {
        return this.log('warn', message, params);
    }
    
    public info(message: string, params?: LogParams) {
        return this.log('info', message, params);
    }
    
    public debug(message: string, params?: LogParams) {
        return this.log('debug', message, params);
    }
    
    public trace(message: string, params?: LogParams) {
        return this.log('trace', message, params);
    }
}

export const logger = Logger.getInstance();