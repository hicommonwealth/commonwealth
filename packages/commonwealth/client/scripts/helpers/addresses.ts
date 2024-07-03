import ChainInfo from 'models/ChainInfo';
import app from 'state';

/**
 * Get the unique communities but also sort them.
 */
export function getUniqueCommunities() {
  const dict: { [id: string]: ChainInfo } = {};

  for (const addr of app.user.addresses) {
    dict[addr.community.id] = addr.community;
  }

  return Object.values(dict).sort((a, b) => a.name.localeCompare(b.name));
}
