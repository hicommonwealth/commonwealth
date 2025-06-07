import { ServiceName } from './constants';

export function getDockerImageUrl(serviceName: ServiceName, commitSha: string) {
  return `ghcr.io/hicommonwealth/${serviceName}:${commitSha}`;
}
