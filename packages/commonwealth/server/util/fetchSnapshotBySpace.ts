import { factory, formatFilename } from 'common-common/src/logging';
import fetch from 'node-fetch';
import { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

export default async function fetchSnapshotBySpace(
  space: string,
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
          proposals (
            first: 20,
            skip: 0,
            where: {
              space_in: ["${space}"]
              state: "closed"
            },
            orderBy: "created",
            orderDirection: desc
          ) {
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          scores
          scores_by_strategy
          scores_total
          scores_updated
          author
          space {
            id
            name
          }
  }
}
        `,
        variables: { space },
      }),
    });

    return await response.json();
  } catch (err) {
    log.error('Error fetching snapshot proposal from GraphQL endpoint', err);
    return err;
  }
}
