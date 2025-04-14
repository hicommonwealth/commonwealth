import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';

const inputs = {
  NominatorSettled: events.NominatorSettled,
  NominatorNominated: events.NominatorNominated,
  JudgeNominated: events.JudgeNominated,
};

export function NominationsPolicy(): Policy<typeof inputs, ZodUndefined> {
  return {
    inputs,
    body: {
      NominatorSettled: async ({ payload }) => {
        // on configure verification
      },
      NominatorNominated: async ({ payload }) => {
        // on mint verification (ID 3 minted)
      },
      JudgeNominated: async ({ payload }) => {
        // on contest judge nomination
      },
    },
  };
}
