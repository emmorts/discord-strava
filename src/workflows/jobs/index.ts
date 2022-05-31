import { MonthlyResultsJob } from "./monthly-results.job";
import { UpdateActivitiesJob } from "./update-activities.job";
import { UpdateAthletePhotoJob } from "./update-athlete-photo.job";

const jobs = [
  new UpdateActivitiesJob(),
  new UpdateAthletePhotoJob(),
  new MonthlyResultsJob()
];

export function getJobs() {
  return jobs;
}