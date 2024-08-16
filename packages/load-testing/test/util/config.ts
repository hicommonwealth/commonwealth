export const SERVER_URL =
  __ENV.SERVER_URL ?? 'http://host.docker.internal:8080';

export const TRPC_API_URL =
  __ENV.TRPC_API_URL ?? `${SERVER_URL}/api/internal/trpc`;

export const LEGACY_API_URL = __ENV.LEGACY_API_URL ?? `${SERVER_URL}/api`;
