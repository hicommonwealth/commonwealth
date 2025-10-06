export function getDockerImageUrl(commitSha: string) {
  return `ghcr.io/hicommonwealth/commonwealth-ephemeral:${commitSha}`;
}
