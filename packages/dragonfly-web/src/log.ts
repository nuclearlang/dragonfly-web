// Logs with the place they are written at (the transpiler passes `at`: component › kind › Class.method · file:line).
export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  at?: string;
  data?: Record<string, unknown>;
  time: Date;
}

const sinks: ((entry: LogEntry) => void)[] = [consoleSink];

function consoleSink(e: LogEntry): void {
  const line = `${e.at ? `[${e.at}] ` : ''}${e.message}`;
  const data = e.data ? [e.data] : [];
  if (e.level === 'error') console.error(line, ...data);
  else if (e.level === 'warning') console.warn(line, ...data);
  else console.log(line, ...data);
}

function write(level: LogLevel, message: string, options: { at?: string; data?: Record<string, unknown> }): void {
  const entry: LogEntry = { level, message, at: options.at, data: options.data, time: new Date() };
  for (const s of sinks) s(entry);
}

export const Log = {
  d: (message: string, options: { at?: string; data?: Record<string, unknown> } = {}) => write('debug', message, options),
  i: (message: string, options: { at?: string; data?: Record<string, unknown> } = {}) => write('info', message, options),
  s: (message: string, options: { at?: string; data?: Record<string, unknown> } = {}) => write('success', message, options),
  w: (message: string, options: { at?: string; data?: Record<string, unknown> } = {}) => write('warning', message, options),
  e: (message: string, options: { at?: string; data?: Record<string, unknown> } = {}) => write('error', message, options),

  /** Adds an output (a file, a server); the console stays unless `replace` is true. */
  sink(sink: (entry: LogEntry) => void, options: { replace?: boolean } = {}): void {
    if (options.replace) sinks.length = 0;
    sinks.push(sink);
  },
};
