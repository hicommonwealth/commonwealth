import useFetchConfigurationQuery, {
  fetchCachedConfiguration,
} from './fetchConfiguration';
import useFetchCustomDomainQuery, {
  fetchCachedCustomDomain,
  fetchCustomDomainQuery,
} from './fetchCustomDomain';
import {
  fetchCachedPublicEnvVar,
  fetchPublicEnvVar,
} from './fetchPublicEnvVar';

import type { Configuration } from './fetchConfiguration';

export {
  fetchCachedConfiguration,
  fetchCachedCustomDomain,
  fetchCachedPublicEnvVar,
  fetchCustomDomainQuery,
  fetchPublicEnvVar,
  useFetchConfigurationQuery,
  useFetchCustomDomainQuery,
};
export type { Configuration };
