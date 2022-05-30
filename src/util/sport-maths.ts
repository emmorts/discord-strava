/**
 * Get distance in kilometers
 * @param distance Total distance in meters
 * @returns Formatted string with kilometers
 */
export function getDistance(distance: number | null): string | null {
  if (!distance) return null;

  return `${round(distance / 1000)} km`;
}

/**
 * Get time in hours
 * @param seconds Total time in seconds
 * @returns Total time in hours
 */
export function getTime(seconds: number | null): string | null {
  if (!seconds) return null;

  return `${round(seconds / 3600)} h`;
}

/**
 * Get a formatted time expression
 * @param seconds Total time in seconds
 * @returns Formatted time string
 */
export function getFormattedTime(seconds: number | null): string | null {
  if (!seconds) return null;

  const totalTime = seconds / 60;
  const totalHours = (~~(totalTime / 60));
  const totalMinutes = (~~totalTime - totalHours * 60);
  const totalSeconds = Math.round(totalTime % 1 * 60);

  return totalHours === 0
    ? `${pad(totalMinutes)}:${pad(totalSeconds)}`
    : `${pad(totalHours)}:${pad(totalMinutes)}:${pad(totalSeconds)}`;
}

/**
 * Get a formatted pace expression
 * @param distance Total distance in meters
 * @param seconds Total time in seconds
 * @returns Formatted pace
 */
export function getPace(distance: number | null, seconds: number | null): string | null {
  if (!distance || !seconds) return null;

  const paceTime = seconds * 1000 / 60 / distance;
  const paceMinutes = ~~paceTime;
  const paceSeconds = ~~(paceTime % 1 * 60);

  return `${paceMinutes}:${pad(paceSeconds)} /km`;
}

/**
 * Get a formatted heart rate expression
 * @param heartRate Average heart rate
 * @returns Average heart rate with units
 */
export function getHeartRate(heartRate: number | null): string | null {
  if (!heartRate) return null;

  return `${heartRate} bpm`;
}

/**
 * Get a formatted cadence expression
 * @param cadence Average cadence
 * @returns Average cadence with units
 */
export function getCadence(cadence: number | null): string | null {
  if (!cadence) return null;

  return `${cadence * 2} spm`;
}

/**
 * Get a formatted speed expression in km/h
 * @param averageSpeed Average speed in mph
 * @returns Average speed in kmh
 */
export function getSpeed(averageSpeed: number | null): string | null {
  if (!averageSpeed) return null;

  return `${round(averageSpeed * 3.6)} km/h`;
}

/**
 * Get a rounded decimal value
 * @param value Value to round
 * @param decimals Decimal points to round to
 * @returns Rounded decimal value
 */
export function round(value: number, decimals: number = 2): string {
  const exponent = Math.pow(10, decimals);

  return (Math.round(value * exponent) / exponent).toFixed(decimals);
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}