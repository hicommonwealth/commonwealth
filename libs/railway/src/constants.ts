export const RailWayAPI = 'https://backboard.railway.app/graphql/v2';

export const RailwayParentEnvName = 'Parent Env';

/**
 * The name of the services on Railway.
 */
export const ServiceNames = ['web'] as const;
export type ServiceName = (typeof ServiceNames)[number];

/**
 * The paths to the executable JS files executed in the context of the
 * Commonwealth_ephemeral Dockerfile.
 */
export const ExecutableFiles: Record<ServiceName, string> = {
  web: 'build/server.js',
} as const;

/**
 * This prefix is combined with one of the executable file paths from above to
 * dynamically build a start command
 */
export const StartCommandPrefix =
  'NODE_ENV=production node --enable-source-maps';

export const WEB_PORT = 8080;
