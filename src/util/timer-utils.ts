import { hrtime } from 'node:process';

export async function timeAsync<T>(fn: () => Promise<T>, callback: (elapsed: bigint, result: T) => void) {
  const start = hrtime.bigint();

  const result = await fn();

  const end = hrtime.bigint();

  callback(end - start, result);

  return result;
}

export function formatNs(ns: bigint) {
  const nanosecond = BigInt(1e9);
  const seconds = Math.floor(Number(ns / nanosecond));
  const ms = Math.floor(Number(ns % nanosecond) / 1e6);

  return `${seconds}.${ms} s`;
}