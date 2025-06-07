import { dispose } from '@hicommonwealth/core';
import { logger } from 'core/src/logging';
import { config } from '../config';
import {
  ExecutableFiles,
  RailwayParentEnvName,
  ServiceNames,
  StartCommandPrefix,
  WEB_PORT,
} from '../constants';
import {
  RestartPolicyType,
  ServiceCreateMutation,
  ServiceInstanceDeployV2Mutation,
} from '../generated/graphql';
import { sdk } from '../sdk';
import { getDockerImageUrl, waitForDeploymentCompletion } from '../utils';

const log = logger(import.meta);

async function createEnvironment() {
  log.info(`Creating environment ${RailwayParentEnvName}`);
  const env = await sdk.environmentCreate({
    input: {
      name: RailwayParentEnvName,
      projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID,
      skipInitialDeploys: true,
      stageInitialChanges: false,
    },
  });
  log.info(
    `Created environment ${RailwayParentEnvName} with id ${env.environmentCreate.id}`,
  );
  return env;
}

async function createServices({
  envId,
  commitSha,
}: {
  envId: string;
  commitSha: string;
}) {
  const services: ServiceCreateMutation[] = [];
  for (const serviceName of ServiceNames) {
    log.info(`Creating service ${serviceName}`);
    const service = await sdk.serviceCreate({
      input: {
        environmentId: envId,
        projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID,
        name: serviceName,
        source: {
          image: getDockerImageUrl(serviceName, commitSha),
        },
      },
    });
    await sdk.serviceInstanceUpdate({
      serviceId: service.serviceCreate.id,
      environmentId: envId,
      input: {
        restartPolicyType: RestartPolicyType.Never,
        startCommand: `${StartCommandPrefix} ${ExecutableFiles[serviceName]}`,
      },
    });
    if (serviceName === 'web') {
      await sdk.serviceDomainCreate({
        input: {
          environmentId: envId,
          serviceId: service.serviceCreate.id,
          targetPort: WEB_PORT,
        },
      });
    }
    log.info(
      `Created service ${serviceName} with id ${service.serviceCreate.id}`,
    );
    services.push(service);
  }
  return services;
}

async function deployServices({
  envId,
  services,
}: {
  envId: string;
  services: ServiceCreateMutation[];
}) {
  const deployments: ServiceInstanceDeployV2Mutation[] = [];
  for (const service of services) {
    log.info(`Deploying service ${service.serviceCreate.name}`);
    const deployment = await sdk.serviceInstanceDeployV2({
      serviceId: service.serviceCreate.id,
      environmentId: envId,
    });
    deployments.push(deployment);
    log.info(
      `Deployed service ${service.serviceCreate.name} with id ${deployment.serviceInstanceDeployV2}`,
    );
  }
  return deployments;
}

async function main() {
  if (!config.RAILWAY) {
    throw new Error('Invalid Railway config');
  }

  const args = process.argv.slice(1);
  const commitSha = args.find((arg) => arg.startsWith('--commit='));

  if (!commitSha) {
    throw new Error(
      'Usage: tsx createParentReviewApp.ts --commit=<commit-sha>',
    );
  }

  const env = await createEnvironment();
  const services = await createServices({
    envId: env.environmentCreate.id,
    commitSha: commitSha.split('=')[1],
  });
  const deployments = await deployServices({
    envId: env.environmentCreate.id,
    services,
  });

  for (const deployment of deployments) {
    const status = await waitForDeploymentCompletion(
      deployment.serviceInstanceDeployV2,
    );
    log.info(
      `Deployment ${deployment.serviceInstanceDeployV2} status: ${status}`,
    );
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
