import { format } from 'date-fns';

export function getLongMonth(date: Date = new Date()) {
  return format(date, 'LLLL');
}