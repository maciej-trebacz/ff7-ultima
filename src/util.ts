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
