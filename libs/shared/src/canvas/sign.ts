import { SignedMessage } from '@canvas-js/gossiplog';
import type { Action, Message, Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  CanvasSignResult,
  addressSwapper,
  getSessionSigners,
} from '@hicommonwealth/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = any;

export class SessionKeyError extends Error {
  readonly address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly ssoSource: any; // This was removed from the SessionKeyError constructor, so it's probably not needed

  constructor({
    name,
    message,
    address,
    ssoSource,
  }: {
    name: string;
    message: string;
    address: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ssoSource?: any;
  }) {
    super(message);
    this.name = name;
    this.address = address;
    this.ssoSource = ssoSource;
  }
}

// Sign an arbitrary action, using the returned `signer` from getSessionSigners()
export async function sign(
  did: string,
  call: string,
  args: Args,
  getClock: () => Promise<[number, string[]]>,
): Promise<CanvasSignResult | null> {
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(did)) {
      let lookupDid = did;

      const [, , chainBaseFromAddress, chainIdFromAddress, walletAddress] =
        did.split(':');

      // if using polkadot, we need to convert the address so that it has the prefix 42
      if (chainBaseFromAddress === 'polkadot') {
        const swappedWalletAddress = addressSwapper({
          address: walletAddress,
          currentPrefix: 42,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        lookupDid = `did:pkh:polkadot:${chainIdFromAddress}:${swappedWalletAddress}`;
      }

      const savedSessionMessage = await signer.getSession(CANVAS_TOPIC, {
        did,
      });

      if (!savedSessionMessage) {
        return null;
        // throw new SessionKeyError({
        //   name: 'Authentication Error',
        //   message: `No session found for ${did}`,
        //   address: walletAddress,
        // });
      }
      const { payload: session, signer: messageSigner } = savedSessionMessage;

      // check if session is expired
      if (session.context.duration) {
        const sessionExpirationTime =
          session.context.timestamp + session.context.duration;
        if (Date.now() > sessionExpirationTime) {
          throw new SessionKeyError({
            name: 'Authentication Error',
            message: `Session expired for ${did}`,
            address: walletAddress,
          });
        }
      }

      // get the clock and parents from the backend
      const [clock, parents] = await getClock();

      const sessionMessage: Message<Session> = {
        clock,
        parents,
        topic: CANVAS_TOPIC,
        payload: session,
      };

      const sessionMessageSignature = await messageSigner.sign(sessionMessage);
      const sessionMessageId = SignedMessage.encode(
        sessionMessageSignature,
        sessionMessage,
      ).id;

      const actionMessage: Message<Action> = {
        clock: clock + 1,
        parents: [sessionMessageId],
        topic: CANVAS_TOPIC,
        payload: {
          type: 'action' as const,
          did: session.did,
          context: {
            timestamp: Date.now(),
          },
          name: call,
          args,
        },
      };

      const actionMessageSignature = await messageSigner.sign(actionMessage);
      const actionMessageId = SignedMessage.encode(
        actionMessageSignature,
        actionMessage,
      ).id;

      return {
        canvasSignedData: {
          sessionMessage,
          sessionMessageSignature,
          actionMessage,
          actionMessageSignature,
        },
        canvasMsgId: actionMessageId,
      };
    }
  }
  throw new Error(`No signer found for ${did}`);
}
