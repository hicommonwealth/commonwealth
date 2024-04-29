import fs from 'fs';
import { performance } from 'perf_hooks';

export function getStandardDeviation(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n,
  );
}

export function getMedian(values) {
  if (values.length === 0) throw new Error('No inputs');
  values.sort(function (a, b) {
    return a - b;
  });
  let half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

/**
 * This function wraps around a given function to be tested and logs various stats
 * @param numSamples The number of times to repeat the benchmark i.e. 10 numSamples with 100 numIter = 1000 total requests
 * @param numIter The number of times to run the given function in a single sample
 * @param execFunc The function to run/benchmark
 * @param log A boolean dictating whether to log results to stdout
 * @param outputFile A filepath to which results should be logged to
 */
export function syncPerformanceTester(
  numSamples,
  numIter,
  execFunc,
  log,
  outputFile,
) {
  const results = [];
  for (let i = 0; i < numSamples; i++) {
    const startTime = performance.now();
    for (let j = 0; j < numIter; j++) {
      execFunc();
    }
    const endTime = performance.now();
    const avg = (endTime - startTime) / numIter;
    results.push(avg);
    const logString = `[${i + 1}]\tTotal time: ${
      endTime - startTime
    },\tAverage Response Time: ${avg}`;
    if (log) console.log(logString);
    if (outputFile) {
      fs.writeFile(outputFile, logString, (err) => {
        if (err) console.error(err);
      });
    }
  }
  let sum = 0;
  results.forEach((x) => (sum += x));
  const logString =
    `\n[Overall]\tTotal time: ${sum}\tAverage Response Time: ${
      sum / results.length
    }` +
    `\tStandard Deviation: ${getStandardDeviation(
      results,
    )}\t Median: ${getMedian(results)}`;
  if (log) console.log(logString);
  if (outputFile) {
    fs.writeFile(outputFile, logString, (err) => {
      if (err) console.error(err);
    });
  }
}

export function asyncPerformanceTester(numSamples, numIter, execFunc) {
  for (let i = 0; i < numSamples; i++) {
    const startTime = performance.now();
    const arr = [];
    for (let i = 0; i < numIter; i++) {
      arr.push(execFunc());
    }
    Promise.all(arr).then(() => {
      const endTime = performance.now();
      console.log(`Total time: ${endTime - startTime}`);
    });
  }
}
