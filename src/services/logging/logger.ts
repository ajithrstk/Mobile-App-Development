export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export type LogContext = Record<string, boolean | number | string | null | undefined>;

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
};

const sensitiveKeyPattern = /(authorization|token|password|secret|message|body|otp|email|phone)/i;

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, sensitiveKeyPattern.test(key) ? '[redacted]' : value]),
  );
}

class Logger {
  private debugEnabled = __DEV__;
  private reporters: Array<(entry: LogEntry) => void> = [];

  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  addReporter(reporter: (entry: LogEntry) => void): () => void {
    this.reporters.push(reporter);

    return () => {
      this.reporters = this.reporters.filter((activeReporter) => activeReporter !== reporter);
    };
  }

  debug(message: string, context?: LogContext): void {
    if (this.debugEnabled) {
      this.write(LogLevel.Debug, message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.write(LogLevel.Info, message, context);
  }

  warning(message: string, context?: LogContext): void {
    this.write(LogLevel.Warning, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.write(LogLevel.Error, message, context, error);
  }

  private write(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context: sanitizeContext(context),
      error,
      timestamp: new Date().toISOString(),
    };

    this.reporters.forEach((reporter) => reporter(entry));

    void error;
  }
}

export const logger = new Logger();
