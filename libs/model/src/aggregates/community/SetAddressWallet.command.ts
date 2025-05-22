import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function SetAddressWallet(): Command<typeof schemas.SetAddressWallet> {
  return {
    ...schemas.SetAddressWallet,
    auth: [authRoles()],
    secure: true,
    body: async ({ payload, context }) => {
      const { wallet_id } = payload;

      if (context?.address.wallet_id)
        throw new InvalidInput('Address already has wallet id');

      await models.Address.update(
        { wallet_id },
        { where: { id: context?.address.id } },
      );
      return true;
    },
  };
}
