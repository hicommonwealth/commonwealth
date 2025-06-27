import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../../database';
import { authOptionalForThread, UnauthorizedView } from '../../middleware';
import { filterGates, joinGates, withGates } from '../../utils/gating';

export function GetThreadById(): Query<typeof schemas.GetThreadById> {
  return {
    ...schemas.GetThreadById,
    auth: [authOptionalForThread],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread_id } = payload;

      // find open gates in thread's community
      const [open_thread] = await sequelize.query<{
        id: number;
      }>(
        `
        ${withGates(actor)}
        SELECT T.id
        FROM
          "Threads" T
          ${joinGates(actor)}
        WHERE
          T.id = :thread_id
          ${filterGates(actor)}
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            address_id: actor.address_id,
            community_id: context?.community_id,
            thread_id,
          },
        },
      );
      if (!open_thread) throw new UnauthorizedView(actor);

      // TODO: refactor using plain sql and add gating filters
      const thread = await models.Thread.findOne({
        where: { id: thread_id },
        include: [
          {
            model: models.Address,
            as: 'Address',
            include: [
              {
                model: models.User,
                as: 'User',
                required: true,
                attributes: ['id', 'profile', 'tier'],
              },
            ],
          },
          {
            model: models.Address,
            as: 'collaborators',
            include: [
              {
                model: models.User,
                as: 'User',
                required: true,
                attributes: ['id', 'profile', 'tier'],
              },
            ],
          },
          {
            model: models.Topic,
            as: 'topic',
            required: true,
          },
          {
            model: models.Reaction,
            as: 'reactions',
            include: [
              {
                model: models.Address,
                as: 'Address',
                required: true,
                include: [
                  {
                    model: models.User,
                    as: 'User',
                    required: true,
                    attributes: ['id', 'profile', 'tier'],
                  },
                ],
              },
            ],
          },
          {
            model: models.ContestAction,
            where: { action: 'upvoted' },
            required: false,
            attributes: ['content_id', 'thread_id'],
            include: [
              {
                model: models.Contest,
                on: {
                  contest_id: sequelize.where(
                    sequelize.col('"ContestActions".contest_id'),
                    '=',
                    sequelize.col('"ContestActions->Contest".contest_id'),
                  ),
                  contest_address: sequelize.where(
                    sequelize.col('"ContestActions".contest_address'),
                    '=',
                    sequelize.col('"ContestActions->Contest".contest_address'),
                  ),
                },
                attributes: [
                  'contest_id',
                  'contest_address',
                  'score',
                  'start_time',
                  'end_time',
                ],
                include: [
                  {
                    model: models.ContestManager,
                    attributes: ['name', 'cancelled', 'interval'],
                  },
                ],
              },
            ],
          },
          { model: models.ThreadVersionHistory },
        ],
      });

      if (!thread) {
        throw new InvalidState('Thread not found');
      }

      return thread!.toJSON() as z.infer<typeof schemas.ThreadView>;
    },
  };
}
