import { DB } from '../models';

function generateQuery(id: string): string {
  const query = `
    query {
    proposal(id:${id}) {
    id
    title
    body
    choices
    start
    end
    snapshot
    state
    author
    created
    scores
    scores_by_strategy
    scores_total
    scores_updated
    plugins
    network
    strategies {
      name
      network
      params
    }
      space {
        id
        name
      }
      }
    }`;
  return query;
}

async function createSnapshotProposal(res: any, models: DB) {
  try {
    const createdProposal = models.SnapshotProposal.create({
      id: res.data.proposal.id,
      space: res.data.proposal.space.id,
      expire: res.data.proposal.end,
    });

    return createdProposal;
  } catch (err) {
    console.log(err);
  }
}

export default async function processNewSnapshotProposal(id: string, models: DB) {
  const query = generateQuery(id);

  try {
    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await response.json();
    const proposal = await createSnapshotProposal(json, models);

    return proposal;
  } catch (err) {
    console.log(err);
    return err;
  }
}
