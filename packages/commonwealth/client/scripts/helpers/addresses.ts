import ChainInfo from 'models/ChainInfo';
import { userStore } from '../state/ui/user';

/**
 * Get the unique communities but also sort them.
 */
export function getUniqueCommunities() {
  const dict: { [id: string]: ChainInfo } = {};

  for (const addr of userStore.getState().addresses) {
    dict[addr.community.id] = addr.community;
  }

  return Object.values(dict).sort((a, b) => a.name.localeCompare(b.name));
}
