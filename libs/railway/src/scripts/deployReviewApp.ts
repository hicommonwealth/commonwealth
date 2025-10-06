import { dispose, logger } from '@hicommonwealth/core';
import fs from 'fs';
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
          skipInitialDeploys: false,
          stageInitialChanges: false,
          applyChangesInBackground: true,
        },
      });
      envId = newEnv.environmentCreate.id;
    } catch (e) {
      log.error(
        'Failed to create environment.',
        e instanceof Error ? e : undefined,
      );
      throw e;
    }
  }

  return { envId, created: !existingEnv };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ServiceMap = Record<ServiceName, { id: string; domain: string }>;

async function getServices(envId: string): Promise<ServiceMap> {
  log.info('Fetching services...');

  const maxRetryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const baseDelay = 1000; // 1 second base delay
  let totalTime = 0;
  let attempt = 0;

  while (totalTime < maxRetryTime) {
    try {
      const services = await sdk.environment({
        id: envId,
      });

      // Check if we have any service instances
      if (services.environment.serviceInstances.edges.length > 0) {
        const serviceMap: Partial<ServiceMap> = {};
        for (const edge of services.environment.serviceInstances.edges) {
          if (ServiceNames.includes(edge.node.serviceName as ServiceName)) {
            serviceMap[edge.node.serviceName as ServiceName] = {
              id: edge.node.serviceId,
              domain: edge.node.domains.serviceDomains[0].domain,
            };
          }
        }
        return serviceMap as ServiceMap;
      }

      // If no services found, calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000); // Cap at 30 seconds
      log.info(
        `No services found yet. Retrying in ${delay}ms (attempt ${attempt + 1})...`,
      );

      await sleep(delay);
      totalTime += delay;
      attempt++;
    } catch (error) {
      log.error(
        'Error fetching services:',
        error instanceof Error ? error : undefined,
      );

      // On error, also use exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
      log.info(
        `Retrying after error in ${delay}ms (attempt ${attempt + 1})...`,
      );

      await sleep(delay);
      totalTime += delay;
      attempt++;
    }
  }

  throw new Error('Failed to fetch services after 5 minutes of retrying');
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

  console.log(dbUrl, created);
  if (dbUrl && created) {
    log.info('Updating database URL env var...');
    await sdk.variableCollectionUpsert({
      input: {
        projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
        environmentId: envId,
        variables: {
          DATABASE_URL: dbUrl,
          SERVER_URL: serviceMap['web'].domain,
        },
      },
    });
    log.info('Database URL successfully updated!');
  }

  for (const [serviceName, { id: serviceId }] of Object.entries(serviceMap)) {
    await updateService({
      envId,
      serviceId,
      serviceName: serviceName as ServiceName,
      restartPolicy: RestartPolicyType.Never,
      commitSha,
    });
  }

  const deploymentIds: string[] = [];
  for (const { id: serviceId } of Object.values(serviceMap)) {
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
