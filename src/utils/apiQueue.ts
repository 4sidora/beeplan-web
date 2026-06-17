/** Ограничение параллельных запросов к API (лимит браузера ~6 на origin). */
const MAX_IN_FLIGHT = 4;
let inFlight = 0;
const waiters: Array<() => void> = [];

function acquire(): Promise<void> {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiters.push(() => {
      inFlight += 1;
      resolve();
    });
  });
}

function release(): void {
  inFlight -= 1;
  const next = waiters.shift();
  if (next) next();
}

export async function withApiSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}
