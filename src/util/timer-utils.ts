import { hrtime } from 'node:process';

export async function timeAsync<T>(fn: () => Promise<T>, callback: (elapsed: bigint, result: T) => void) {
  const start = hrtime.bigint();

  const result = await fn();

  const end = hrtime.bigint();

  callback(end - start, result);

  return result;
}

export function formatNs<Num extends bigint | number>(ns: Num) {
  const seconds = Math.floor(ns / 1e9);
  const ms = Math.floor((ns % 1e9) / 1e6);

  return `${seconds}.${ms} s`;
}