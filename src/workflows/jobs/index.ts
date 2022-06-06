import { JobBase } from './job-base';
import { MonthlyResultsJob } from "./monthly-results.job";
import { UpdateActivitiesJob } from "./update-activities.job";
import { UpdateAthletePhotoJob } from "./update-athlete-photo.job";

const jobs: { new(): JobBase }[] = [
  UpdateActivitiesJob,
  UpdateAthletePhotoJob,
  MonthlyResultsJob
];

export function getJobs() {
  return jobs;
}