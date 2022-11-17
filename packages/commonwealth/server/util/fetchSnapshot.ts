import fetch from 'node-fetch';
import { DB } from '../models';

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
    console.log(err);
  }
}

export default async function fetchNewSnapshotProposal(
  id: string,
  models: DB
) {
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
    console.log({ response });
    const json = await response.json();
    const proposal = await createSnapshotProposal(json, models);

    return proposal;
  } catch (err) {
    console.log(err);
    return err;
  }
}
