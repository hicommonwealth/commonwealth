import {
  InvalidActor,
  InvalidInput,
  logger,
  notificationsProvider,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import _ from 'lodash';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';

const log = logger(import.meta);
// limit number of users in non-production environment
const USERS_PER_DB_REQUEST = config.APP_ENV === 'production' ? 20_000 : 100;

export function TriggerNotificationsWorkflow(): Command<
  typeof schemas.TriggerNotificationsWorkflow
> {
  return {
    ...schemas.TriggerNotificationsWorkflow,
    // TODO: Super admins only
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      // eslint-disable-next-line max-len
      // TODO: temporary until https://github.com/hicommonwealth/commonwealth/pull/9149/files#diff-202572644b13676ddc020d6a289ef1f2a22af01e984702b3b378514537eac8f6R223
      if (!actor.user.isAdmin)
        throw new InvalidActor(actor, 'Must be super admin');

      let successfulTriggers = 0;
      let failedTriggers = 0;
      const errors: {
        reason: string;
        first_user_id: number;
        last_user_id: number;
      }[] = [];

      let count = USERS_PER_DB_REQUEST;
      let lastUserId = 0;
      const provider = notificationsProvider();
      while (count === USERS_PER_DB_REQUEST) {
        const users = await models.User.findAll({
          attributes: ['id'],
          where: {
            id: {
              [Op.gt]: lastUserId,
            },
          },
          order: [['id', 'DESC']],
          limit: USERS_PER_DB_REQUEST,
        });
        if (!users.length) break;
        lastUserId = users.at(-1)!.id!;
        count = users.length;

        try {
          const res = await provider.triggerWorkflow({
            // This any exists because this function usage (variable workflow_id)
            // is an exception to support a super admin (growth) facing feature
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            key: payload.workflow_key as any,
            users: users.map((u) => ({
              id: String(u.id),
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: payload.data as any,
          });

          // TODO: centralize chunk size i.e. MAX_RECIPIENTS_PER_WORKFLOW_TRIGGER in adapters
          const chunks = _.chunk(users, 1_000);
          res.forEach((r, i) => {
            if (r.status === 'fulfilled')
              successfulTriggers += chunks[i].length;
            else {
              if ('status' in r.reason && r.reason.status === 404) {
                throw new InvalidInput('Invalid workspace key!');
              }

              failedTriggers += chunks[i].length;
              errors.push({
                reason: JSON.stringify(r.reason),
                first_user_id: chunks[i][0].id!,
                last_user_id: chunks[i].at(-1)!.id!,
              });
            }
          });
        } catch (e) {
          if (e instanceof InvalidInput) throw e;

          log.error(
            `SUPER_ADMIN NOTIFICATION TRIGGER: Failed to trigger workflows`,
            e as Error,
            {
              workflow_key: payload.workflow_key,
              data: payload.data,
              first_user_id: users[0].id,
              last_user_id: users.at(-1)!.id,
            },
          );
        }

        // don't loop through all users in non-production environments
        if (config.APP_ENV !== 'production') break;
      }

      if (errors.length > 0 || failedTriggers > 0) {
        log.error(
          `SUPER_ADMIN NOTIFICATION TRIGGER: ${failedTriggers} users will not receive a notification`,
          undefined,
          {
            workflow_key: payload.workflow_key,
            data: payload.data,
            failed_promises: errors,
          },
        );
      }

      return {
        numSucceeded: successfulTriggers,
        numFailed: failedTriggers,
      };
    },
  };
}
