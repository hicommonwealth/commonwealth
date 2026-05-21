import { DeploymentStatus } from '../generated/graphql';
import { sdk } from '../sdk';

const STATUS_POLL_INTERVAL_MS = 60_000; // 1 minute
const STATUS_MAX_WAIT_TIME_MS = 20 * 60_000; // 20 minutes

const TERMINAL_FAILURE_STATUSES = new Set<DeploymentStatus>([
  DeploymentStatus.Crashed,
  DeploymentStatus.Failed,
  DeploymentStatus.Removed,
  DeploymentStatus.Removing,
  DeploymentStatus.NeedsApproval,
  DeploymentStatus.Skipped,
]);

const SUCCESS_STATUSES = new Set<DeploymentStatus>([
  DeploymentStatus.Success,
  DeploymentStatus.Sleeping,
]);

const IN_PROGRESS_STATUSES = new Set<DeploymentStatus>([
  DeploymentStatus.Queued,
  DeploymentStatus.Waiting,
  DeploymentStatus.Building,
  DeploymentStatus.Initializing,
  DeploymentStatus.Deploying,
]);

export type DeploymentSnapshot = {
  status: DeploymentStatus;
  url?: string | null;
  serviceName: string;
};

export async function getDeploymentStatus(
  deploymentId: string,
): Promise<DeploymentSnapshot> {
  const res = await sdk.deployment({ id: deploymentId });

  return {
    status: res.deployment.status,
    url: res.deployment.staticUrl,
    serviceName: res.deployment.service.name,
  };
}

export async function waitForDeploymentCompletion(
  deploymentId: string,
): Promise<DeploymentSnapshot> {
  const startTime = Date.now();

  while (Date.now() - startTime < STATUS_MAX_WAIT_TIME_MS) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    console.log(
      `[railway] [${elapsedSeconds}s] Fetching status for deployment ${deploymentId}`,
    );

    const dep = await getDeploymentStatus(deploymentId);

    console.log(
      `[railway] [${elapsedSeconds}s] service=${dep.serviceName} status=${dep.status}`,
    );

    if (SUCCESS_STATUSES.has(dep.status)) {
      console.log(
        `[railway] Deployment succeeded for service '${dep.serviceName}'`,
      );
      return dep;
    }

    if (TERMINAL_FAILURE_STATUSES.has(dep.status)) {
      throw new Error(
        `Railway deployment failed for service '${dep.serviceName}' with status: ${dep.status}`,
      );
    }

    if (IN_PROGRESS_STATUSES.has(dep.status)) {
      console.log(
        `[railway] Deployment still in progress (${dep.status}); retrying in ${
          STATUS_POLL_INTERVAL_MS / 1000
        }s`,
      );

      await sleep(STATUS_POLL_INTERVAL_MS);
      continue;
    }

    throw new Error(
      `Unknown Railway deployment status '${dep.status}' for service '${dep.serviceName}'`,
    );
  }

  throw new Error(
    `Timed out waiting for Railway deployment after ${
      STATUS_MAX_WAIT_TIME_MS / 60000
    } minutes. Check the Railway dashboard for final status.`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
