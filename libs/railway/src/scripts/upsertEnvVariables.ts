import { dispose } from '@hicommonwealth/core';
import { config } from '../config';
import { sdk } from '../sdk';

async function getEnvironmentId(envName: string) {
  const res = await sdk.environments({
    projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID,
  });
  const env = res.environments.edges.find((edge) => edge.node.name === envName);
  if (!env) {
    throw new Error(`Environment ${envName} not found`);
  }
  return env.node.id;
}

async function upsertEnvVariables({
  envId,
  envVar,
}: {
  envId: string;
  envVar: Record<string, string>;
}) {
  await sdk.variableCollectionUpsert({
    input: {
      projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID,
      environmentId: envId,
      variables: envVar,
    },
  });
}

async function main() {
  const args = process.argv.slice(2);

  // Parse environment name
  const envArg = args.find((arg) => arg.startsWith('--env='));
  if (!envArg) {
    throw new Error(
      'Usage: tsx upsertEnvVariables.ts --env=[env-name] --env-var NAME=value NAME2=value2',
    );
  }
  const envName = envArg.split('=')[1];

  // Parse environment variables
  const envVarArg = args.find((arg) => arg.startsWith('--env-var'));
  if (!envVarArg) {
    throw new Error(
      'Usage: tsx upsertEnvVariables.ts --env=[env-name] --env-var NAME=value NAME2=value2',
    );
  }

  // Convert env vars string to object
  const envVarsString = args.slice(args.indexOf(envVarArg) + 1);
  const envVars: Record<string, string> = {};

  for (const pair of envVarsString) {
    if (pair.startsWith('--')) break; // Stop if we hit another argument
    const [key, value] = pair.split('=');
    if (!key || !value) {
      throw new Error(
        `Invalid environment variable format: ${pair}. Expected format: NAME=value`,
      );
    }
    envVars[key] = value;
  }

  if (Object.keys(envVars).length === 0) {
    throw new Error('No environment variables provided');
  }

  const envId = await getEnvironmentId(envName);
  await upsertEnvVariables({ envId, envVar: envVars });
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
