import { DeploymentStatus } from '../generated/graphql';
import { sdk } from '../sdk';

// Poll for deployment status every 60 seconds (avg deployment takes 45 seconds)
const STATUS_POLL_INTERVAL = 1_000 * 60;
// Wait for max 3 minutes for deployment to complete (3 retries)
const STATUS_MAX_WAIT_TIME = 1_000 * 60 * 3;

export async function getDeploymentStatus(deploymentId: string) {
  const res = await sdk.deployment({
    id: deploymentId,
  });
  return {
    status: res.deployment.status,
    url: res.deployment.staticUrl,
    serviceName: res.deployment.service.name,
  };
}

export async function waitForDeploymentCompletion(deploymentId: string) {
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
