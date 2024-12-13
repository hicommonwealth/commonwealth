import { Session } from '@canvas-js/interfaces';
import { SignIn } from '@hicommonwealth/schemas';
import { serializeCanvas } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import Account from 'client/scripts/models/Account';
import { trpc } from 'client/scripts/utils/trpcClient';
import { z } from 'zod';

export function useSignIn() {
  const mutation = trpc.user.signIn.useMutation({
    onError: (error) => {
      notifyError(error.message);
    },
  });

  const signIn = async (
    session: Session,
    payload: Omit<z.infer<typeof SignIn.input>, 'session'>,
  ) => {
    const address = await mutation.mutateAsync({
      ...payload,
      session: serializeCanvas(session),
    });
    const account = new Account({
      sessionPublicAddress: session.publicKey,
      addressId: address.id,
      address: address.address,
      community: {
        id: address.community_id,
        base: address.community_base,
        ss58Prefix: address.community_ss58_prefix ?? undefined,
      },
      validationToken: address.verification_token,
      walletId: address.wallet_id!,
      validationBlockInfo: address.block_info ?? undefined,
      ignoreProfile: false,
      signedInProfile: {
        userId: address.user_id!,
        name: address.User?.profile?.name ?? undefined,
        avatarUrl: address.User?.profile?.avatar_url ?? undefined,
        lastActive: new Date(address.last_active!),
      },
    });
    return {
      account,
      newlyCreated: address.newly_created,
      joinedCommunity: address.joined_community,
    };
  };

  return { signIn };
}
