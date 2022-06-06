import { Logger } from 'winston';
import { JobOptions } from './job-options';

export abstract class JobBase {
  abstract get options(): JobOptions;

  abstract execute(logger: Logger): Promise<void>;
}