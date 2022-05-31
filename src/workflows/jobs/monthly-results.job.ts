import { subDays } from 'date-fns';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';

export class MonthlyResultsJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'monthly-results',
      schedule: '0 0 1 * *',
      immediate: true
    };
  }

  execute(): Promise<void> {
    const yesterday = subDays(new Date(), 1);
    throw new Error("Method not implemented.");
  }
}