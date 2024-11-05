import * as schemas from '@hicommonwealth/schemas';
import {
  CANVAS_TOPIC,
  getTestSigner,
  sign,
  toCanvasSignedDataApiArgs,
} from '@hicommonwealth/shared';
import { z } from 'zod';

export async function getSignersInfo(roles: readonly string[]): Promise<
  Array<{
    signer: ReturnType<typeof getTestSigner>;
    did: `did:${string}`;
    address: `0x${string}`;
  }>
> {
  return await Promise.all(
    roles.map(async () => {
      const signer = getTestSigner();
      const did = await signer.getDid();
      await signer.newSession(CANVAS_TOPIC);
      return {
        signer,
        did,
        address: signer.getAddressFromDid(did),
      };
    }),
  );
}

export async function signCreateThread(
  address: string,
  payload: z.infer<typeof schemas.CreateThread.input>,
) {
  const did = `did:pkh:eip155:1:${address}`;
  return {
    ...payload,
    ...toCanvasSignedDataApiArgs(
      await sign(
        did,
        'thread',
        {
          community: payload.community_id,
          title: payload.title,
          body: payload.body,
          link: payload.url,
          topic: payload.topic_id,
        },
        async () => [1, []] as [number, string[]],
      ),
    ),
  };
}
