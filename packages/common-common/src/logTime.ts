// Small set of functions to log runtime of functions
export function diffMilliseconds(start, end = Date.now()) {
  const millis = end - start;
  return millis;
}

export function diffSeconds(start, end = Date.now()) {
  const millis = diffMilliseconds(start, end);
  return millis / 1000;
}

export function makeTimeObject(log, label, tags, order) {
  const start = Date.now();
  label = `====${label} ${JSON.stringify(tags, order)}`;
  return {
    start,
    end: () => log.info(`${label} ${diffMilliseconds(start)} ms`),
    error: () => log.error(`${label} ${diffMilliseconds(start)} ms`),
  };
}
