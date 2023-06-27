// REFERENCE: https://github.com/apache/beam-starter-typescript/tree/main

import * as beam from 'apache-beam';
import * as runner from 'apache-beam/runners/runner';

export function createPipeline(inputText) {
  // A pipeline is simply a callable that takes a root object.
  return (root: beam.Root) => {
    return root
      .apply(beam.create(['Hello', 'World!', inputText]))
      .map(printAndReturn);
  };
}

export async function runPipeline(options) {
  // Here we create a runner based on the provided options, and use it
  // to run the above pipeline.
  await runner
    .createRunner(options)
    .run(createPipeline(options.inputText || 'Default Input Text'));
}

function printAndReturn(element) {
  console.log(element);
  return element;
}

function main() {
  runPipeline({}).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
main();
