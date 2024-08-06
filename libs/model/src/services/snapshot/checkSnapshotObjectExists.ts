import { logger } from '@hicommonwealth/core';

const log = logger(import.meta);

export async function checkSnapshotObjectExists(
  type: 'space' | 'proposal',
  id: string,
): Promise<boolean> {
  try {
    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: `
         query($id: String!) {
            ${type}(id: $id) {
            id
          }
        }`,
        variables: { id },
      }),
    });
    const json = await response.json();

    if (json?.data.space) return true;
  } catch (e) {
    log.error(`Failed to query snapshot ${type}`, e as Error, { [type]: id });
  }

  return false;
}
