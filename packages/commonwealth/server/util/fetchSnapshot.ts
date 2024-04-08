import { logger } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import fetch from 'node-fetch';

const log = logger().getLogger(__filename);

async function createSnapshotProposal(res: any, models: DB) {
  try {
    const createdProposal = models.SnapshotProposal.create({
      id: res.data.proposal.id,
      space: res.data.proposal.space.id,
      event: 'fetched-from-snapshot',
      expire: res.data.proposal.end,
    });

    return createdProposal;
  } catch (err) {
    log.error('Error creating snapshot proposal record', err);
  }
}

export default async function fetchNewSnapshotProposal(id: string, models: DB) {
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
            proposal(id: $id) {
            id
            end
            space {
              id
            }
          }
        }`,
        variables: { id },
      }),
    });

    const json = await response.json();
    const proposal = await createSnapshotProposal(json, models);

    return proposal;
  } catch (err) {
    log.error('Error fetching snapshot proposal from GraphQL endpoint', err);
    return err;
  }
}
