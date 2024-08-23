import useFetchConfigurationQuery, {
  fetchCachedConfiguration,
} from './fetchConfiguration';
import useFetchCustomDomainQuery, {
  fetchCachedCustomDomain,
  fetchCustomDomainQuery,
} from './fetchCustomDomain';

import type { Configuration } from './fetchConfiguration';

export {
  fetchCachedConfiguration,
  fetchCachedCustomDomain,
  fetchCustomDomainQuery,
  useFetchConfigurationQuery,
  useFetchCustomDomainQuery,
};
export type { Configuration };
