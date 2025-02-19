"use strict";

import { statuses } from "./ff7Statuses";
import { ElementalType } from "./types";

export const waitFor = async (condition: () => Promise<boolean>) => {
  return new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      try {
        if (await condition()) {
          clearInterval(intervalId);
          resolve(true);
        }
      } catch (e) {
        // This one's for mushroom
        console.log("Error: ", e);
        clearInterval(intervalId);
      }
    }, 100);
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

export const formatStatus = (status: number, flags: number, skipInvincibility?: boolean, printAll?: boolean) => {
  let statusCount = 0;
  let statusList = [];
  for (const key in statuses) {
    if (status & statuses[key as keyof typeof statuses]) {
      statusCount++;
      statusList.push(key);
    }
  }
  if (!skipInvincibility) {
    if (flags & 0x1) statusCount++;
    if (flags & 0x2) statusCount++;
  }
  if (statusCount === 0) {
    return null;
  }
  if (printAll) {
    return statusList.join(", ");
  }
  return statusCount === 1 ? statusList[0] : `${statusCount} effects`;
}

export const getElementName = (element: number) => {
  if (element >= 0x10 && element < 0x20) {
    return "No Effect";
  }
  if (element >= 0x20 && element < 0x40) {
    return Object.keys(statuses)[element - 0x20] + " (status)";
  }
  return ElementalType[element] || "Unknown";
}
