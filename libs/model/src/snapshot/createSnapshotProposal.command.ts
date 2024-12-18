import {
  InvalidInput,
  InvalidState,
  logger,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import { models } from '../database';
import { emitEvent } from '../utils/utils';

const log = logger(import.meta);

const Errors = {
  FailedParsing: 'Failed to parse id and/or event from payload',
  SpaceNotDefined: 'Space is not defined',
  ProposalNotFound: 'Proposal not found',
};

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

// This should technically be an 'event' but the express adapter
// does not support events yet
export function CreateSnapshotProposal(): Command<
  typeof schemas.CreateSnapshotProposal
> {
  return {
    ...schemas.CreateSnapshotProposal,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const parsedId = payload.id.replace(/.*\//, '');
      const eventType = payload.event.split('/')[1];

      if (!parsedId || !eventType) {
        log.error(Errors.FailedParsing, undefined, {
          payload,
        });
        throw new InvalidInput(Errors.FailedParsing);
      }

      const associatedCommunity = await models.Community.findOne({
        where: {
          snapshot_spaces: {
            [Op.contains]: [payload.space],
          },
        },
      });
      if (!associatedCommunity) return { success: true };

      const response = await fetchNewSnapshotProposal(parsedId);
      const proposal = response.data.proposal;
      if (!proposal) {
        log.error(Errors.ProposalNotFound, undefined, { response });
        throw new InvalidState(Errors.ProposalNotFound);
      }

      const space = proposal.space.id;
      if (!space) {
        log.error(Errors.SpaceNotDefined, undefined, { response });
        throw new InvalidState(Errors.SpaceNotDefined);
      }

      await emitEvent(models.Outbox, [
        {
          event_name: schemas.EventNames.SnapshotProposalCreated,
          event_payload: {
            id: parsedId,
            event: payload.event,
            title: proposal.title ?? null,
            body: proposal.body ?? null,
            choices: proposal.choices ?? null,
            space: space ?? null,
            start: proposal.start ?? null,
            expire: proposal.end ?? null,
            token: payload.token,
            secret: payload.secret,
          },
        },
      ]);

      return { success: true };
    },
  };
}
