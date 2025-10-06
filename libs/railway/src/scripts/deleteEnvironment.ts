import { dispose, logger } from '@hicommonwealth/core';
import { config } from '../config';
import { sdk } from '../sdk';

const log = logger(import.meta);

export async function deleteEnvironment(envName: string) {
  log.info('Fetching environments...');
  const envs = await sdk.environments({
    projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
  });

  let envId: string | undefined;
  for (const edge of envs.environments.edges) {
    if (edge.node.name === envName) {
      log.info(`Environment ${envName} found!`);
      envId = edge.node.id;
    }
  }

  if (!envId) {
    throw new Error(`Environment '${envName}' not found!`);
  }

  log.info(`Deleting environment: ${envName}`);
  const deleted = await sdk.environmentDelete({
    id: envId,
  });

  if (deleted.environmentDelete) return;
  throw new Error(`Failed to deleted environment '${envName}'`);
}

async function main() {
  if (!config.RAILWAY) {
    throw new Error('Invalid Railway config');
  }

  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith('--env='));
  if (!envArg) {
    throw new Error('Usage: tsx deleteEnvironment.ts --env=<environment-name>');
  }
  const envName = envArg.split('=')[1];
  await deleteEnvironment(envName);
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      console.log('Success!');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
