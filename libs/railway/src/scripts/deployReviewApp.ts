import { dispose, logger } from '@hicommonwealth/core';
import { GraphQLClient } from 'graphql-request';
import { config } from '../config';
import {
  ExecutableFiles,
  RailWayAPI,
  ServiceName,
  ServiceNames,
  StartCommandPrefix,
} from '../constants';
import {
  DeploymentStatus,
  getSdk,
  RestartPolicyType,
} from '../generated/graphql';
import { getDockerImageUrl } from '../utils';

const log = logger(import.meta);

// Poll for deployment status every 60 seconds (avg deployment takes 45 seconds)
const STATUS_POLL_INTERVAL = 1_000 * 60;
// Wait for max 3 minutes for deployment to complete (3 retries)
const STATUS_MAX_WAIT_TIME = 1_000 * 60 * 3;

const client = new GraphQLClient(RailWayAPI, {
  headers: {
    authorization: `Bearer ${config.RAILWAY!.TOKEN}`,
  },
});

const sdk = getSdk(client);

async function getEnvironmentId(envName: string) {
  log.info('Fetching environments...');
  const envs = await sdk.environments({
    projectId: config.RAILWAY!.REVIEW_APPS.PROJECT_ID!,
  });

  let envId: string | undefined;
  for (const edge of envs.environments.edges) {
    if (edge.node.name === envName) {
      log.info(`Environment ${envName} found!`);
      envId = edge.node.id;
      break;
    }
  }

  if (!envId) {
    log.info(`Environment ${envName} not found. Creating new environment...`);
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
  }

  return envId;
}

async function getServices(envId: string) {
  log.info('Fetching services...');
  const services = await sdk.environment({
    id: envId,
  });

  const serviceMap: Partial<Record<ServiceName, string>> = {};
  for (const edge of services.environment.serviceInstances.edges) {
    if (!ServiceNames.includes(edge.node.serviceName as ServiceName)) {
      throw new Error('Unrecognized service');
    }
    serviceMap[edge.node.serviceName as ServiceName] = edge.node.serviceId;
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
  log.info(`Updating service '${serviceName}' image to sha: ${commitSha}...`);

  const serviceUpdate = await sdk.serviceInstanceUpdate({
    serviceId,
    environmentId: envId,
    input: {
      source: {
        image: getDockerImageUrl(serviceName, commitSha),
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

async function getDeploymentStatus(deploymentId: string) {
  const res = await sdk.deployment({
    id: deploymentId,
  });
  return {
    status: res.deployment.status,
    url: res.deployment.staticUrl,
    serviceName: res.deployment.service.name,
  };
}

async function waitForDeploymentCompletion(deploymentId: string) {
  const startTime = Date.now();

  while (Date.now() - startTime < STATUS_MAX_WAIT_TIME) {
    console.log(`Fetching status for deployment: ${deploymentId}`);
    const dep = await getDeploymentStatus(deploymentId);
    console.log(`Deployment '${deploymentId}' status: ${dep.status}`);

    if (['SUCCESS', 'SLEEPING'].includes(dep.status)) {
      console.log(`Deployment of '${dep.serviceName} succeeded!'`);
      return dep;
    } else if (
      [
        DeploymentStatus.Crashed,
        DeploymentStatus.Failed,
        DeploymentStatus.Removed,
        DeploymentStatus.Removing,
        DeploymentStatus.NeedsApproval,
        DeploymentStatus.Skipped,
      ].includes(dep.status)
    ) {
      throw new Error(
        `Deployment of '${dep.serviceName}' failed with status: ${dep.status}`,
      );
    }

    if (
      [
        DeploymentStatus.Queued,
        DeploymentStatus.Waiting,
        DeploymentStatus.Building,
        DeploymentStatus.Initializing,
        DeploymentStatus.Deploying,
      ].includes(dep.status)
    ) {
      await new Promise((resolve) => {
        console.log(
          `Deployment not finished, retrying in ${STATUS_POLL_INTERVAL}`,
        );
        return setTimeout(resolve, STATUS_POLL_INTERVAL);
      });
    } else {
      throw new Error(
        `Unknown status '${dep.status}' for service ${dep.serviceName}`,
      );
    }
  }

  throw new Error(`Failed to await deployment status`);
}

export async function deployReviewApp({
  envName,
  commitSha,
}: {
  envName: string;
  commitSha: string;
}) {
  try {
    const envId = await getEnvironmentId(envName);
    const serviceMap = await getServices(envId);
    log.info(JSON.stringify(serviceMap));

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
      }
    }

    try {
      if (deploymentUrl) {
        const fs = require('fs');
        fs.appendFileSync(
          process.env.GITHUB_ENV,
          `DEPLOYMENT_URL=${deploymentUrl}`,
        );
      }
    } catch (e) {
      console.error('Failed to save deployment URL');
      throw new Error('Failed to save deployment URL');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith('--env='));
  const commitArg = args.find((arg) => arg.startsWith('--commit='));

  if (!envArg || !commitArg) {
    console.error(
      'Usage: node deployReviewApp.js --env=<environment-name> --commit=<commit-sha>',
    );
    process.exit(1);
  }

  const envName = envArg.split('=')[1];
  const commitSha = commitArg.split('=')[1];

  deployReviewApp({ envName, commitSha })
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
