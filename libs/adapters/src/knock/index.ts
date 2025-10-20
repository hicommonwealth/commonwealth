import {
  logger,
  NotificationsProvider,
  NotificationsProviderGetMessagesOptions,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderSchedulesReturn,
  NotificationsProviderTriggerOptions,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { MAX_RECIPIENTS_PER_WORKFLOW_TRIGGER } from '@hicommonwealth/shared';
import Knock, { signUserToken } from '@knocklabs/node';
import _ from 'lodash';
import { config } from '../config';

const log = logger(import.meta);

function formatScheduleResponse(
  schedules: Knock.Schedule[],
): NotificationsProviderSchedulesReturn {
  return schedules.map((s) => ({
    id: s.id,
    actor: s.actor !== null ? s.actor : undefined,
    recipient: s.recipient,
    data: s.data,
    workflow: s.workflow,
    repeats: s.repeats,
    last_occurrence_at: s.last_occurrence_at
      ? new Date(s.last_occurrence_at)
      : undefined,
    next_occurrence_at: s.next_occurrence_at
      ? new Date(s.next_occurrence_at)
      : undefined,
    inserted_at: s.inserted_at,
    updated_at: s.updated_at,
  }));
}

let activeWorkflows: WorkflowKeys[] | undefined = undefined;
let activeWorkflowsCacheTimestamp: number | undefined = undefined;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function KnockProvider(): NotificationsProvider {
  const knock = new Knock({
    apiKey: config.NOTIFICATIONS.KNOCK_SECRET_KEY,
  });

  async function getExistingKnockTokensForUser(
    userId: number,
    channelId: string,
  ): Promise<ReadonlyArray<string>> {
    try {
      const channelData = await knock.users.getChannelData(
        `${userId}`,
        channelId,
      );
      if ('tokens' in channelData.data) return channelData.data.tokens;
      return [];
    } catch (e) {
      // the knock SDK says it returns '404' if the user does not have channel
      // data but the typescript SDK doesn't provide the status so there's no
      // way to find out what type of error this is...
      log.error('Unable to fetch existing tokens: ', e as Error);
      return [];
    }
  }

  function computeChannelId(channelType: 'FCM' | 'APNS'): string | undefined {
    switch (channelType) {
      case 'FCM':
        return config.PUSH_NOTIFICATIONS.KNOCK_FCM_CHANNEL_ID;

      case 'APNS':
        return config.PUSH_NOTIFICATIONS.KNOCK_APNS_CHANNEL_ID;
    }
  }

  async function isActiveWorkflow(workflowKey: WorkflowKeys): Promise<boolean> {
    // Check if cache is still valid
    const now = Date.now();
    const isCacheValid =
      activeWorkflows &&
      activeWorkflowsCacheTimestamp &&
      now - activeWorkflowsCacheTimestamp < CACHE_TTL_MS;

    // Return cached result if available and not expired
    if (isCacheValid && activeWorkflows!.includes(workflowKey)) return true;

    try {
      // Fetch workflows from Knock Management API
      const response = await fetch('https://api.knock.app/v1/workflows', {
        headers: {
          Authorization: `Bearer ${config.NOTIFICATIONS.KNOCK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        log.error(
          'Failed to fetch workflows from Knock Management API',
          undefined,
          {
            status: response.status,
            statusText: response.statusText,
          },
        );
        return false;
      }

      const data = await response.json();

      // Extract active workflow keys
      if (data.entries && Array.isArray(data.entries)) {
        const fetchedWorkflows = data.entries
          .filter((workflow: { active: boolean }) => workflow.active)
          .map(
            (workflow: { key: string; active: boolean }) =>
              workflow.key as WorkflowKeys,
          );

        activeWorkflows = fetchedWorkflows;
        activeWorkflowsCacheTimestamp = Date.now();

        log.info('Successfully fetched and cached active workflows', {
          count: fetchedWorkflows.length,
          workflows: fetchedWorkflows,
          cacheExpiresAt: new Date(
            activeWorkflowsCacheTimestamp + CACHE_TTL_MS,
          ).toISOString(),
        });

        return fetchedWorkflows.includes(workflowKey);
      }

      return false;
    } catch (error) {
      log.error(
        'Error fetching workflows from Knock Management API',
        error as Error,
      );
      return false;
    }
  }

  return {
    name: 'KnockProvider',
    dispose: () => Promise.resolve(),
    async triggerWorkflow(
      options: NotificationsProviderTriggerOptions,
    ): Promise<PromiseSettledResult<{ workflow_run_id: string }>[]> {
      // disable webhook workflow in all environments except production
      // this is to prevent sending webhooks to real endpoints in all other env
      if (options.key === 'webhooks' && !config.NOTIFICATIONS.WEBHOOKS.SEND) {
        log.warn('Webhooks disabled');
        return [];
      }

      // ignore events without a workflow
      if (
        [
          WorkflowKeys.ContestStarted,
          WorkflowKeys.ContestEnding,
          WorkflowKeys.ContestEnded,
          WorkflowKeys.QuestStarted,
          WorkflowKeys.AddressOwnershipTransferred,
        ].includes(options.key)
      ) {
        log.warn(
          `Ingoring notification ${options.key} until workflow gets implemented!`,
        );
        return [];
      }

      if (!(await isActiveWorkflow(options.key))) {
        log.warn(`Workflow '${options.key}' is disabled on Knock!`);
        return [];
      }

      const recipientChunks = _.chunk(
        options.users,
        MAX_RECIPIENTS_PER_WORKFLOW_TRIGGER,
      );
      const triggerPromises = recipientChunks.map((chunk) => {
        return knock.workflows.trigger(options.key, {
          recipients: chunk,
          data: options.data,
          // TODO: disabled pending Knock support - UPDATE: PR merged in Knock SDK repo but await new release
          // actor: options.actor,
        });
      });

      const res = await Promise.allSettled(triggerPromises);
      res.forEach((r) => {
        if (r.status === 'rejected') {
          log.error('KNOCK PROVIDER: Failed to trigger workflow', undefined, {
            workflow_key: options.key,
            data: options.data,
            reason: JSON.stringify(r.reason),
          });
        }
      });
      return res;
    },
    async getMessages(
      options: NotificationsProviderGetMessagesOptions,
    ): Promise<NotificationsProviderGetMessagesReturn> {
      const res = await knock.users.listMessages(options.user_id, {
        page_size: options.page_size,
        channel_id: options.channel_id,
        after: options.cursor,
      });

      return res.items;
    },

    async getSchedules(options): Promise<NotificationsProviderSchedulesReturn> {
      try {
        const res = await knock.users.listSchedules(options.user_id, {
          workflow: options.workflow_id,
        });
        return formatScheduleResponse(res.entries);
      } catch (e) {
        if (e instanceof Knock.APIError && e.status === 404) {
          return [];
        } else throw e;
      }
    },

    async createSchedules(options) {
      const res = await knock.schedules.create({
        workflow: options.workflow_id,
        recipients: options.user_ids,
        repeats: options.schedule,
      });
      return formatScheduleResponse(res);
    },

    async updateSchedules(options) {
      const res = await knock.schedules.update({
        schedule_ids: options.schedule_ids,
        repeats: options.schedule,
      });
      return formatScheduleResponse(res);
    },

    async deleteSchedules(options) {
      const res = await knock.schedules.delete(options);
      return new Set(res.map((s) => s.id));
    },

    async identifyUser(options) {
      return knock.users.update(options.user_id, options.user_properties);
    },

    async registerClientRegistrationToken(
      userId: number,
      token: string,
      channelType: 'FCM' | 'APNS',
    ): Promise<boolean> {
      const channelId = computeChannelId(channelType);

      if (channelId) {
        const existingTokens = await getExistingKnockTokensForUser(
          userId,
          channelId,
        );
        const tokens: Array<string> = [token, ...existingTokens];

        await knock.users.setChannelData(`${userId}`, channelId, {
          data: {
            tokens,
          },
        });
        return true;
      } else {
        log.warn('Push notifications not enabled');
        return false;
      }
    },

    async unregisterClientRegistrationToken(
      userId: number,
      token: string,
      channelType: 'FCM' | 'APNS',
    ): Promise<boolean> {
      const channelId = computeChannelId(channelType);

      if (channelId) {
        const existingTokens = await getExistingKnockTokensForUser(
          userId,
          channelId,
        );

        const tokens: Array<string> = existingTokens.filter(
          (current) => current !== token,
        );

        await knock.users.setChannelData(`${userId}`, channelId, {
          data: {
            tokens,
          },
        });
        return true;
      } else {
        log.warn('Push notifications not enabled');
        return false;
      }
    },

    async signUserToken(
      userId: number,
      expiresInSeconds: number,
    ): Promise<string> {
      return await signUserToken(`${userId}`, {
        signingKey: config.NOTIFICATIONS.KNOCK_SIGNING_KEY,
        expiresInSeconds,
      });
    },
  };
}
