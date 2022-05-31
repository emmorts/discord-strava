import { JobOptions } from './job-options';

export abstract class JobBase {
  abstract get options(): JobOptions;

  abstract execute(): Promise<void>;
}