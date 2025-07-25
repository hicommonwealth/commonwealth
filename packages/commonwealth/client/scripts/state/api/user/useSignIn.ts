import { Session } from '@canvas-js/interfaces';
import { SignIn } from '@hicommonwealth/schemas';
import { serializeCanvas } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import Account from 'client/scripts/models/Account';
import { trpc } from 'client/scripts/utils/trpcClient';
import { useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';

export function useSignIn() {
  const utils = trpc.useUtils();
  const utilsRef = useRef(utils);
  utilsRef.current = utils;

  const handleSuccess = useCallback(() => {
    utilsRef.current.quest.getQuest.invalidate().catch(console.error);
    utilsRef.current.quest.getQuests.invalidate().catch(console.error);
  }, []);

  const handleError = useCallback((error: Pick<Error, 'message'>) => {
    notifyError(error.message);
  }, []);

  const mutation = trpc.user.signIn.useMutation({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;

  const signIn = useCallback(
    async (
      session: Session,
      payload: Omit<z.infer<typeof SignIn.input>, 'session'>,
    ) => {
      const address = await mutationRef.current.mutateAsync({
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
        newlyCreated: address.is_welcome_onboard_flow_complete,
        joinedCommunity: address.address_created,
      };
    },
    [],
  );

  return useMemo(() => ({ signIn }), [signIn]);
}
