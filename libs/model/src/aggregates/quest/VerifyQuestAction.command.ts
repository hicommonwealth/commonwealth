import {
  Command,
  handleEvent,
  InvalidActor,
  InvalidInput,
  InvalidState,
  logger,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ExternalApiQuestNames } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { URL } from 'url';
import { z } from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { Xp } from '../user';

const log = logger(import.meta);

const KyoFinanceSwapQuestResponse = z.object({
  verified: z.boolean(),
  updatedAt: z.number(),
  data: z.object({
    txHash: z.string().nullable(),
  }),
});

const KyoFinanceLpQuestResponse = z.object({
  verified: z.boolean(),
  updatedAt: z.number(),
  data: z.record(
    z.string(),
    z.object({
      verified: z.boolean(),
      usdValue: z.string(),
    }),
  ),
});

async function queryExternalApi<
  T extends
    | typeof KyoFinanceSwapQuestResponse
    | typeof KyoFinanceLpQuestResponse,
>({
  url,
  params,
  resSchema,
}: {
  url: string;
  params: Record<string, string | number | boolean | Array<string>>;
  resSchema: T;
}): Promise<z.infer<T>> {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        urlObj.searchParams.append(`${key}[]`, v);
      });
    } else {
      urlObj.searchParams.append(key, String(value));
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jsonRes: any;
  try {
    const res = await fetch(urlObj.toString());
    if (!res.ok)
      throw new Error(
        `Fetching external quest data failed with status code ${res.status}`,
      );

    jsonRes = await res.json();
  } catch (e) {
    log.error(
      'Failed to fetch external quest data',
      e instanceof Error ? e : undefined,
      {
        error: e,
        url: urlObj.toString(),
        params,
      },
    );
    throw new Error('Failed to verify external quest');
  }

  const parsedRes = resSchema.safeParse(jsonRes);
  if (!parsedRes.success) {
    log.error(
      'Failed parse external quest verification response',
      parsedRes.error,
      {
        jsonRes,
        url: urlObj.toString(),
        params,
      },
    );
    throw new Error('Failed to verify external quest');
  }

  return parsedRes.data;
}

async function verifyKyoFinanceSwapQuest(
  address: string,
  questActionMeta: z.infer<typeof schemas.KyoFinanceSwapQuestAction>,
): Promise<boolean> {
  const { chainId, ...params } = questActionMeta.metadata;
  const res = await queryExternalApi({
    url: `https://api.cluster.kyo.finance/external-quest/swap/${chainId}`,
    params: { ...params, address },
    resSchema: KyoFinanceSwapQuestResponse,
  });
  return res.verified;
}

async function verifyKyoFinanceLpQuest(
  address: string,
  questActionMeta: z.infer<typeof schemas.KyoFinanceLpQuestAction>,
): Promise<boolean> {
  const { chainId, ...params } = questActionMeta.metadata;
  const res = await queryExternalApi({
    url: `https://api.cluster.kyo.finance/external-quest/lp/${chainId}`,
    params: { ...params, address },
    resSchema: KyoFinanceLpQuestResponse,
  });
  return res.verified;
}

export function VerifyQuestAction(): Command<typeof schemas.VerifyQuestAction> {
  return {
    ...schemas.VerifyQuestAction,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      if (!actor.user.id) throw new InvalidActor(actor, 'User not found');
      const verifiedAt = new Date();
      const { quest_action_meta_id } = payload;

      // verify provided address
      const address = await models.Address.findOne({
        where: {
          address: payload.address,
          user_id: actor.user.id,
          verified: { [Op.ne]: null },
        },
      });
      if (!address) throw new InvalidInput('Address not found');

      const questActionMeta = await models.QuestActionMeta.findOne({
        where: { id: quest_action_meta_id },
      });
      mustExist(`QuestActionMeta ${quest_action_meta_id}`, questActionMeta);

      if (
        !ExternalApiQuestNames.includes(
          questActionMeta.event_name as (typeof ExternalApiQuestNames)[number],
        )
      ) {
        throw new InvalidInput(`Can't manually verify this quest action`);
      }

      const existingXpLog = await models.XpLog.findOne({
        where: {
          user_id: actor.user.id,
          action_meta_id: quest_action_meta_id,
        },
      });
      if (existingXpLog) throw new InvalidState('Quest already completed');

      let actionCompleted = false;
      if (
        questActionMeta.event_name === 'KyoFinanceSwapQuestVerified' &&
        questActionMeta.metadata
      ) {
        actionCompleted = await verifyKyoFinanceSwapQuest(
          address.address,
          questActionMeta,
        );
      } else if (
        questActionMeta.event_name === 'KyoFinanceLpQuestVerified' &&
        questActionMeta.metadata
      ) {
        actionCompleted = await verifyKyoFinanceLpQuest(
          address.address,
          questActionMeta,
        );
      } else {
        throw new InvalidInput(`Can't manually verify this quest action`);
      }

      if (!actionCompleted) throw new InvalidState('Quest incomplete');

      const event = {
        name: questActionMeta.event_name,
        payload: {
          verified_at: verifiedAt,
          user_id: actor.user.id,
          quest_action_meta_id,
        },
      };

      const xpProjection = Xp();
      const res = await handleEvent(xpProjection, event, true);
      return res && Array.isArray(res) && res.length > 0;
    },
  };
}
