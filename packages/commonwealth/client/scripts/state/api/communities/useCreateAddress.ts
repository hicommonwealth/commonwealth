import { Session } from '@canvas-js/interfaces';
import { CreateAddress } from '@hicommonwealth/schemas';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import Account from 'client/scripts/models/Account';
import { trpc } from 'client/scripts/utils/trpcClient';
import { z } from 'zod';

export function useCreateAddressMutation() {
  const mutation = trpc.community.createAddress.useMutation({
    onError: (error) => {
      notifyError(error.message);
    },
  });

  const createAddress = async (
    session: Session,
    payload: z.infer<typeof CreateAddress.input>,
  ) => {
    const created = await mutation.mutateAsync(payload);
    const account = new Account({
      sessionPublicAddress: session.publicKey,
      addressId: created.id,
      address: created.address,
      community: {
        id: created.community_id,
        base: created.community_base,
        ss58Prefix: created.community_ss58_prefix ?? undefined,
      },
      validationToken: created.verification_token,
      walletId: created.wallet_id!,
      validationBlockInfo: created.block_info ?? undefined,
      ignoreProfile: false,
    });
    return {
      account,
      newlyCreated: created.newly_created,
      joinedCommunity: created.joined_community,
    };
  };

  return { createAddress };
}
