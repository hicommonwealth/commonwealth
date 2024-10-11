import { trpc } from '@hicommonwealth/adapters';
import { dispose, logger } from '@hicommonwealth/core';
import { promises as fs } from 'fs';
import { isAbsolute } from 'path';
import { oasOptions, trpcRouter } from '../api/external-router';

const log = logger(import.meta);

async function main() {
  const acceptedArgs = ['production', 'local'];
  if (!acceptedArgs.includes(process.argv[2])) {
    log.error(`Must provied one of: ${JSON.stringify(acceptedArgs)}`);
    return;
  }

  // Check if the second argument is provided and is an absolute filepath
  if (process.argv.length < 4 || !isAbsolute(process.argv[3])) {
    log.error('The second argument must be an absolute filepath.');
    return;
  }

  const filePath = process.argv[3];

  let host =
    process.argv[2] === 'production'
      ? 'https://commonwealth.im'
      : 'http://localhost:8080';

  const oas = trpc.toOpenApiDocument(trpcRouter, host, oasOptions);

  await fs.writeFile(filePath, JSON.stringify(oas, null, 2), 'utf-8');
  log.info(`OpenAPI document saved to ${filePath}`);
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
