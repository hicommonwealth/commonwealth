import { Session } from '@canvas-js/interfaces';
import { SignIn } from '@hicommonwealth/schemas';
import { serializeCanvas } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import Account from 'models/Account';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

export function useSignIn() {
  const utils = trpc.useUtils();

  const mutation = trpc.user.signIn.useMutation({
    onSuccess: () => {
      console.log('SI1: signIn mutation successful');
      utils.quest.getQuest.invalidate().catch(console.error);
      utils.quest.getQuests.invalidate().catch(console.error);
    },
    onError: (error) => {
      console.log('SI-ERROR: signIn mutation failed', error);
      notifyError(error.message);
    },
  });

  const signIn = async (
    session: Session,
    payload: Omit<z.infer<typeof SignIn.input>, 'session'>,
  ) => {
    console.log('SI2: signIn called with payload', payload);
    const address = await mutation.mutateAsync({
      ...payload,
      session: serializeCanvas(session),
    });
    console.log('SI3: signIn returned address', address);
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
    console.log('SI4: Created account object', account);
    return {
      account,
      newlyCreated: address.first_community && address.address_created,
      joinedCommunity: address.address_created,
    };
  };

  return { signIn };
}
