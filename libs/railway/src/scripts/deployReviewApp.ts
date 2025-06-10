import { dispose, logger } from '@hicommonwealth/core';
import { config } from '../config';
import {
  ExecutableFiles,
  ServiceName,
  ServiceNames,
  StartCommandPrefix,
} from '../constants';
import { RestartPolicyType } from '../generated/graphql';
import { sdk } from '../sdk';
import { getDockerImageUrl, waitForDeploymentCompletion } from '../utils';

const log = logger(import.meta);

async function getEnvironmentId(envName: string) {
  log.info('Fetching environments...');
  const envs = await sdk.environments({
    projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
  });

  let envId: string | undefined;
  let existingEnv = false;
  let parentEnvFound = false;
  for (const edge of envs.environments.edges) {
    if (edge.node.id === config.RAILWAY!.REVIEW_APPS.PARENT_ENV_ID) {
      parentEnvFound = true;
    } else if (edge.node.name === envName) {
      log.info(`Environment ${envName} found!`);
      envId = edge.node.id;
      existingEnv = true;
    }
  }

  if (!envId && !parentEnvFound)
    throw new Error('Parent environment to fork not found!');

  if (!envId) {
    log.info(`Environment ${envName} not found. Creating new environment...`);
    try {
      const newEnv = await sdk.environmentCreate({
        input: {
          name: envName,
          projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
          sourceEnvironmentId: config.RAILWAY!.REVIEW_APPS.PARENT_ENV_ID,
          skipInitialDeploys: true,
          stageInitialChanges: false,
        },
      });
      envId = newEnv.environmentCreate.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // If timeout, poll for the environment
      if (e.message && e.message.includes('504')) {
        log.warn('Timeout creating environment, polling for existence...');
        for (let i = 0; i < 6; i++) {
          await new Promise((res) => setTimeout(res, 30_000)); // wait 30 seconds
          const envsRetry = await sdk.environments({
            projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
          });
          const found = envsRetry.environments.edges.find(
            (edge) => edge.node.name === envName,
          );
          if (found) {
            envId = found.node.id;
            log.info(`Environment ${envName} found after timeout!`);
            break;
          }
        }
        if (!envId)
          throw new Error(
            'Environment creation timed out and not found after polling.',
          );
      } else {
        throw e;
      }
    }
  }

  return { envId, created: !existingEnv };
}

async function getServices(envId: string) {
  log.info('Fetching services...');
  const services = await sdk.environment({
    id: envId,
  });

  const serviceMap: Partial<Record<ServiceName, string>> = {};
  for (const edge of services.environment.serviceInstances.edges) {
    if (ServiceNames.includes(edge.node.serviceName as ServiceName)) {
      serviceMap[edge.node.serviceName as ServiceName] = edge.node.serviceId;
    }
  }
  return serviceMap;
}

async function updateService({
  envId,
  serviceId,
  serviceName,
  commitSha,
  restartPolicy,
}: {
  envId: string;
  serviceId: string;
  serviceName: ServiceName;
  commitSha: string;
  restartPolicy: RestartPolicyType;
}) {
  if (!ServiceNames.includes(serviceName)) {
    log.info(`Configuring service '${serviceName}' not needed. Skipping...`);
    return;
  }
  log.info(`Updating service '${serviceName}' image to sha: ${commitSha}...`);

  const serviceUpdate = await sdk.serviceInstanceUpdate({
    serviceId,
    environmentId: envId,
    input: {
      source: {
        image: getDockerImageUrl(commitSha),
      },
      restartPolicyType: restartPolicy,
      startCommand: `${StartCommandPrefix} ${ExecutableFiles[serviceName]}`,
    },
  });

  return serviceUpdate.serviceInstanceUpdate;
}

async function deploy({
  envId,
  serviceId,
}: {
  envId: string;
  serviceId: string;
}) {
  log.info(`Deploying service ${serviceId}`);
  const deployment = await sdk.serviceInstanceDeployV2({
    serviceId,
    environmentId: envId,
  });
  return deployment.serviceInstanceDeployV2;
}

export async function deployReviewApp({
  envName,
  commitSha,
  dbUrl,
}: {
  envName: string;
  commitSha: string;
  dbUrl?: string;
}) {
  const { envId, created } = await getEnvironmentId(envName);
  const serviceMap = await getServices(envId);
  log.info(JSON.stringify(serviceMap));

  if (dbUrl && created) {
    await sdk.variableCollectionUpsert({
      input: {
        projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
        environmentId: envId,
        variables: {
          DATABASE_URL: dbUrl,
        },
      },
    });
  }

  for (const [serviceName, serviceId] of Object.entries(serviceMap)) {
    await updateService({
      envId,
      serviceId,
      serviceName: serviceName as ServiceName,
      restartPolicy: RestartPolicyType.Never,
      commitSha,
    });
  }

  const deploymentIds: string[] = [];
  for (const serviceId of Object.values(serviceMap)) {
    deploymentIds.push(await deploy({ envId, serviceId }));
  }

  let deploymentUrl = '';
  for (const id of deploymentIds) {
    const deployment = await waitForDeploymentCompletion(id);
    if (typeof deployment.url === 'string' && deployment.url.length > 0) {
      if (deploymentUrl.length > 0) {
        console.error('Multiple deployment URLs found!');
        throw new Error('Multiple deployment URLs found!');
      }
      deploymentUrl = deployment.url;
    }
  }

  return deploymentUrl;
}

async function main() {
  if (!config.RAILWAY || !config.RAILWAY.REVIEW_APPS.PARENT_ENV_ID) {
    throw new Error('Invalid Railway config');
  }

  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith('--env='));
  const commitArg = args.find((arg) => arg.startsWith('--commit='));
  const dbUrlArg = args.find((arg) => arg.startsWith('--db-url='));

  if (!envArg || !commitArg) {
    throw new Error(
      'Usage: tsx deployReviewApp.ts --env=<environment-name> --commit=<commit-sha> [--db-url=<database-url>]',
    );
  }

  const envName = envArg.split('=')[1];
  const commitSha = commitArg.split('=')[1];
  const dbUrl = dbUrlArg ? dbUrlArg.split('=')[1] : undefined;

  const deploymentUrl = await deployReviewApp({ envName, commitSha, dbUrl });
  log.info(`Deployment URL: ${deploymentUrl}`);

  try {
    if (
      deploymentUrl &&
      (config.APP_ENV === 'CI' || config.IS_CI) &&
      process.env.GITHUB_ENV
    ) {
      const fs = require('fs');
      fs.appendFileSync(
        process.env.GITHUB_ENV,
        `DEPLOYMENT_URL=${deploymentUrl}`,
      );
    }
  } catch (e) {
    log.error('Failed to save deployment URL');
    throw new Error('Failed to save deployment URL');
  }
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
