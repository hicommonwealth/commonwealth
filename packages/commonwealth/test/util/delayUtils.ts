export function timeoutPromise(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timed out after ${timeout}ms`));
    }, timeout);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
