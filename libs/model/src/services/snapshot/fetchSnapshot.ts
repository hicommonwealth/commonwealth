import { logger } from '@hicommonwealth/logging';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

dotenv.config();

export async function fetchNewSnapshotProposal(id: string) {
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
            title
            body
            start
            choices
            end
            space {
              name
              id
            }
          }
        }`,
        variables: { id },
      }),
    });

    const proposal = await response.json();
    proposal.expire = proposal.end;

    return proposal;
  } catch (err) {
    log.error(
      'Error fetching snapshot proposal from GraphQL endpoint',
      err as Error,
    );
    return err;
  }
}
