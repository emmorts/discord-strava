import { resolve } from 'node:path';
import { createLogger as createWinstonLogger, transports, format, Logger } from 'winston';
import  DailyRotateFile from 'winston-daily-rotate-file';

const LOG_PATH = resolve(__dirname, '../../logs');

const { combine, timestamp, label, printf } = format;
const messageFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const rollingFileTransport = (name: string) => new DailyRotateFile({
  filename: resolve(LOG_PATH, `${name}-%DATE%.log`),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    label({ label: name }),
    timestamp(), 
    format.json()
  )
});

let serverLogger: Logger;
export function getServerLogger(): Logger {
  if (!serverLogger) {
    serverLogger = createLogger('server');
  }

  return serverLogger;
}

let botLogger: Logger;
export function getBotLogger(): Logger {
  if (!botLogger) {
    botLogger = createLogger('bot');
  }

  return botLogger;
}

let workerlogger: Logger;
export function getWorkerLogger(): Logger {
  if (!workerlogger) {
    workerlogger = createLogger('worker');
  }

  return workerlogger;
}

function createLogger(name: string) {
  return createWinstonLogger({
    level: 'info',
    transports: [
      new transports.Console({
        format: combine(
          label({ label: name }),
          timestamp(),
          messageFormat
        )
      }),
      rollingFileTransport(name)
    ]
  });
}