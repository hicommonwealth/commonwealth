// REFERENCE: https://github.com/apache/beam-starter-typescript/tree/main

import * as beam from 'apache-beam';
import { PortableRunner } from 'apache-beam/runners/portable_runner/runner';

export function createPipeline(inputText) {
  // A pipeline is simply a callable that takes a root object.
  return (root: beam.Root) => {
    return root
      .apply(beam.create(['Hello', 'World!', inputText]))
      .map(printAndReturn);
  };
}

function printAndReturn(element) {
  console.log(element);
  return element;
}

async function main() {
  const runner = new PortableRunner({
    jobEndpoint: 'localhost:8081',
    environmentType: 'LOOPBACK',
  });
  return runner.run(createPipeline('Blah blah input!'));
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
