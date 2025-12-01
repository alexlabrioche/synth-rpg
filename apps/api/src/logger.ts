import pino, { stdTimeFunctions, type LoggerOptions } from "pino";
import { Writable } from "node:stream";

type LogLevelNumber = 10 | 20 | 30 | 40 | 50 | 60;

const LEVEL_LABELS: Record<LogLevelNumber, string> = {
  10: "TRACE",
  20: "DEBUG",
  30: "INFO ",
  40: "WARN ",
  50: "ERROR",
  60: "FATAL",
};

const LEVEL_COLORS: Partial<Record<LogLevelNumber, string>> = {
  10: "\x1b[90m",
  20: "\x1b[36m",
  30: "\x1b[32m",
  40: "\x1b[33m",
  50: "\x1b[31m",
  60: "\x1b[41m\x1b[97m",
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

interface PinoLog {
  level: LogLevelNumber;
  time: number;
  msg?: string;
  reqId?: string;
  req?: {
    method?: string;
    url?: string;
  };
  res?: {
    statusCode?: number;
  };
  responseTime?: number;
  err?: {
    message?: string;
    stack?: string;
    type?: string;
  };
  [key: string]: unknown;
}

class PrettyStream extends Writable {
  constructor() {
    super();
  }

  override _write(
    chunk: Buffer,
    _enc: BufferEncoding,
    cb: (error?: Error | null) => void
  ) {
    const lines = chunk
      .toString()
      .split(/\n+/)
      .filter((line) => line.trim().length > 0);

    for (const line of lines) {
      this.printLine(line);
    }

    cb();
  }

  private printLine(line: string) {
    try {
      const payload = JSON.parse(line) as PinoLog;
      const formatted = formatLog(payload);
      process.stdout.write(formatted + "\n");
    } catch {
      process.stdout.write(line + "\n");
    }
  }
}

const prettyEnabled =
  process.env.LOG_PRETTY !== "false" &&
  (process.env.NODE_ENV !== "production" || process.env.LOG_PRETTY === "true");

export function createLogger() {
  const baseOptions: LoggerOptions = {
    level: process.env.LOG_LEVEL ?? "info",
    base: undefined,
    timestamp: stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };

  if (!prettyEnabled) {
    return pino(baseOptions);
  }

  return pino(baseOptions, new PrettyStream());
}

function formatLog(entry: PinoLog): string {
  const time = formatTime(entry.time);
  const levelLabel = LEVEL_LABELS[entry.level] ?? String(entry.level);
  const color = LEVEL_COLORS[entry.level] ?? "";
  const level = color ? `${color}${levelLabel}${RESET}` : levelLabel;
  const message = entry.msg ?? entry.err?.message ?? "";
  const req = entry.req
    ? [entry.req.method, entry.req.url].filter(Boolean).join(" ")
    : "";
  const status = entry.res?.statusCode ? `→ ${entry.res.statusCode}` : "";
  const duration =
    typeof entry.responseTime === "number"
      ? `${entry.responseTime.toFixed(1)}ms`
      : "";
  const reqId = entry.reqId ? `${DIM}#${entry.reqId}${RESET}` : "";
  const baseParts = [
    `${DIM}${time}${RESET}`,
    level,
    req,
    status,
    duration,
    message,
    reqId,
  ].filter((part) => part && part.length > 0);

  let formatted = baseParts.join(" ").replace(/\s+/g, " ").trim();

  if (entry.err?.stack) {
    formatted += `\n${entry.err.stack}`;
  }

  return formatted;
}

function formatTime(value?: number) {
  if (!value) {
    return new Date().toISOString();
  }
  return new Date(value).toISOString();
}
