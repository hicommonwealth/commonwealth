import {
  CANVAS_TOPIC,
  ChainBase,
  CosmosSignerCW,
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
  sign,
} from '@hicommonwealth/shared';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';

export { SessionKeyError } from '@hicommonwealth/shared';

export async function signSessionWithAccount<T extends { address: string }>(
  wallet: IWebWallet<T>,
  account: Account,
) {
  const session = await getSessionFromWallet(wallet);
  const walletAddress = session.did.split(':')[4];
  if (walletAddress !== account.address) {
    throw new Error(
      `Session signed with wrong address ('${walletAddress}', expected '${account.address}')`,
    );
  }
  return session;
}

export const getMagicCosmosSessionSigner = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: { signMessage: any },
  address: string,
  chainId: string,
) => {
  return new CosmosSignerCW({
    signer: {
      type: 'amino',
      getAddress: () => address,
      getChainId: () => chainId,
      signAmino: async (chainIdIgnore, signerIgnore, signDoc) => {
        const { msgs, fee } = signDoc;
        return {
          signed: signDoc,
          signature: await signer.signMessage(msgs, fee),
        };
      },
    },
  });
};

export async function getSessionFromWallet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: IWebWallet<any>,
  { newSession }: { newSession: boolean } = { newSession: false },
) {
  const sessionSigner = await wallet.getSessionSigner();

  if (newSession) {
    const { payload } = await sessionSigner.newSession(CANVAS_TOPIC);
    return payload;
  }

  const session = await sessionSigner.getSession(CANVAS_TOPIC);
  if (session) {
    return session.payload;
  } else {
    const { payload } = await sessionSigner.newSession(CANVAS_TOPIC);
    return payload;
  }
}

export function getEthChainIdOrBech32Prefix({
  base,
  bech32_prefix,
  eth_chain_id,
}: {
  base: ChainBase;
  bech32_prefix?: string;
  eth_chain_id?: number;
}) {
  return base === ChainBase.CosmosSDK
    ? bech32_prefix || 'cosmos'
    : eth_chain_id || 1;
}

function getDidForCurrentAddress(
  address: string,
  base?: ChainBase,
  ethChainIdOrBech32Prefix?: string | number,
) {
  const idOrPrefix = ethChainIdOrBech32Prefix
    ? ethChainIdOrBech32Prefix
    : app?.chain?.base === ChainBase.CosmosSDK
      ? app?.chain?.meta?.bech32_prefix || 'cosmos'
      : app?.chain?.meta?.ChainNode?.eth_chain_id || 1;
  const chainBase = base || app.chain.base;
  const caip2Prefix = chainBaseToCaip2(chainBase);

  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  return `did:pkh:${caip2Prefix}:${canvasChainId}:${address}`;
}

async function getClockFromAPI(): Promise<[number, string[]]> {
  const response = await axios.get(`${SERVER_URL}/getCanvasClock`);
  const { clock, heads: parents } = response.data.result;
  return [clock, parents];
}

// Public signer methods
export async function signThread(
  address: string,
  {
    community,
    base,
    title,
    body,
    link,
    topic,
    ethChainIdOrBech32Prefix,
  }: {
    community: string;
    base: ChainBase;
    title: string;
    body?: string;
    link?: string;
    topic?: number;
    ethChainIdOrBech32Prefix?: string | number;
  },
) {
  return await sign(
    getDidForCurrentAddress(address, base, ethChainIdOrBech32Prefix),
    'thread',
    {
      community: community || '',
      title,
      body,
      link: link || '',
      topic: topic || '',
    },
    getClockFromAPI,
  );
}

export async function signUpdateThread(
  address: string,
  { thread_id, title, body, link, topic },
) {
  return await sign(
    getDidForCurrentAddress(address),
    'updateThread',
    {
      thread_id,
      title,
      body,
      link: link || '',
      topic: topic || '',
    },
    getClockFromAPI,
  );
}

export async function signDeleteThread(address: string, { thread_id }) {
  return await sign(
    getDidForCurrentAddress(address),
    'deleteThread',
    {
      thread_id,
    },
    getClockFromAPI,
  );
}

export async function signComment(
  address: string,
  { thread_id, body, parent_comment_id },
) {
  return await sign(
    getDidForCurrentAddress(address),
    'comment',
    {
      thread_id,
      body,
      parent_comment_id,
    },
    getClockFromAPI,
  );
}

export async function signUpdateComment(address: string, { comment_id, body }) {
  return await sign(
    getDidForCurrentAddress(address),
    'updateComment',
    {
      comment_id,
      body,
    },
    getClockFromAPI,
  );
}

export async function signDeleteComment(address: string, { comment_id }) {
  return await sign(
    getDidForCurrentAddress(address),
    'deleteComment',
    {
      comment_id,
    },
    getClockFromAPI,
  );
}

export async function signThreadReaction(address: string, { thread_id, like }) {
  const value = like ? 'like' : 'dislike';
  return await sign(
    getDidForCurrentAddress(address),
    'reactThread',
    {
      thread_id,
      value,
    },
    getClockFromAPI,
  );
}

export async function signDeleteThreadReaction(address: string, { thread_id }) {
  return await sign(
    getDidForCurrentAddress(address),
    'unreactThread',
    {
      thread_id,
    },
    getClockFromAPI,
  );
}

export async function signCommentReaction(
  address: string,
  { comment_id, like },
) {
  const value = like ? 'like' : 'dislike';
  return await sign(
    getDidForCurrentAddress(address),
    'reactComment',
    {
      comment_id,
      value,
    },
    getClockFromAPI,
  );
}

export async function signDeleteCommentReaction(
  address: string,
  { comment_id },
) {
  return await sign(
    getDidForCurrentAddress(address),
    'unreactComment',
    {
      comment_id,
    },
    getClockFromAPI,
  );
}
