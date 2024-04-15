import { logger } from '@hicommonwealth/logging';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const log = logger(__filename);

dotenv.config();

export default async function fetchNewSnapshotProposal(
  id: string,
  eventType: string,
) {
  try {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'development') {
      if (eventType === 'deleted') {
        log.info('Proposal deleted, returning null');
        return { data: { proposal: null } };
      }

      const dummyProposal = {
        data: {
          proposal: {
            id: 'proposal/0x1234',
            title: 'Dummy Proposal',
            body: 'This is a dummy proposal',
            choices: ['Yes', 'No'],
            space: { name: 'Dummy Space', id: 'dummy-space.eth' },
            start: 1660680000, // TODO: is this the format we get back?
            end: 1670680000,
          },
        },
      };

      return dummyProposal;
    }

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
    log.error('Error fetching snapshot proposal from GraphQL endpoint', err);
    return err;
  }
}
