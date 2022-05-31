import { UpdateActivitiesJob } from "./update-activities.job";
import { UpdateAthletePhotoJob } from "./update-athlete-photo.job";

const jobs = [
  new UpdateActivitiesJob(),
  new UpdateAthletePhotoJob()
];

export function getJobs() {
  return jobs;
}