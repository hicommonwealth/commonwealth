export function waitForCondition(
  conditionFn: () => boolean | Promise<boolean>,
  checkInterval: number = 100,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();

    let intervalId;
    intervalId = setInterval(async () => {
      let result: boolean;

      try {
        result = await conditionFn();
      } catch (e) {
        clearInterval(intervalId);
        reject(e);
        return;
      }

      if (result) {
        clearInterval(intervalId);
        resolve();
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        clearInterval(intervalId);
        reject(new Error('Timed out waiting for condition'));
      }
    }, checkInterval);
  });
}
