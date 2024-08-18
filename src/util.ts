"use strict";

export const waitFor = async (condition: () => Promise<boolean>) => {
  return new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      try {
        if (await condition()) {
          clearInterval(intervalId);
          resolve(true);
        }
      } catch (e) {
        console.log("Error: ", e);
        clearInterval(intervalId);
      }
    }, 250);
  });
};

export function formatTime(seconds: number): string {
  if (!seconds || seconds === 0xFFFFFFFF) {
    return "∞";
  }

  const zeroPad = (num: number) => String(num).padStart(2, '0');

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formattedHours = hours > 0 ? `${zeroPad(hours)}:` : '';
  const formattedMinutes = (hours > 0 || minutes > 0) ? `${zeroPad(minutes)}:` : '';
  const formattedSeconds = zeroPad(secs);

  return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
}
