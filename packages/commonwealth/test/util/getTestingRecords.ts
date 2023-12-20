import type { ActionPayload, Session } from '@canvas-js/interfaces';
import {
  SignTypedDataVersion,
  personalSign,
  signTypedData,
} from '@metamask/eth-sig-util';
import {
  TEST_BLOCK_INFO_BLOCKHASH,
  createSiweMessage,
  getEIP712SignableAction,
} from 'adapters/chain/ethereum/keys';
import { chainBaseToCanvasChainId, createCanvasSessionPayload } from 'canvas';
import { ChainBase } from 'common-common/src/types';
import crypto from 'crypto';
import wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
import * as siwe from 'siwe';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../../server/config';
import models from '../../server/database';
import { AddressInstance } from '../../server/models/address';
import { CommentInstance } from '../../server/models/comment';
import { CommunityInstance } from '../../server/models/community';
import { ThreadInstance } from '../../server/models/thread';
import { TopicInstance } from '../../server/models/topic';
import { UserInstance } from '../../server/models/user';
import {
  getTestChain,
  getTestChainNode,
  getTestUser,
} from '../integration/evmChainEvents/util';
import { generateEthAddress } from './modelUtils';

export const { keypair, address } = generateEthAddress();

// only for EVM
export async function getTestAddress(): Promise<{
  community: CommunityInstance;
  user: UserInstance;
  address: AddressInstance;
  wallet: wallet;
}> {
  const community = await getTestChain();

  const user = await getTestUser();
  const now = new Date();
  const [addressInstance, createdAddress] = await models.Address.findOrCreate({
    where: {
      address: address,
      community_id: community.id,
      user_id: user.id,
      wallet_id: 'metamask',
    },
    defaults: {
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(
        +now + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      ),
      verified: now,
      ghost_address: false,
    },
  });

  if (!createdAddress) {
    await addressInstance.update({
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(
        +now + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      ),
      verified: now,
      ghost_address: false,
    });
  }

  return { community, user, address: addressInstance, wallet: keypair };
}

export async function getTestUserSession(
  address: AddressInstance,
  wallet: wallet,
) {
  const chainNode = await getTestChainNode();
  const sessionWallet = ethers.Wallet.createRandom();
  const timestamp = 1665083987891;
  const sessionPayload = createCanvasSessionPayload(
    ChainBase.Ethereum,
    chainBaseToCanvasChainId(ChainBase.Ethereum, chainNode.eth_chain_id),
    address.address,
    sessionWallet.address,
    timestamp,
    TEST_BLOCK_INFO_BLOCKHASH,
  );
  const nonce = siwe.generateNonce();
  const domain = 'https://commonwealth.test';
  const siweMessage = createSiweMessage(sessionPayload, domain, nonce);
  const signatureData = personalSign({
    privateKey: wallet.getPrivateKey(),
    data: siweMessage,
  });
  const signature = `${domain}/${nonce}/${signatureData}`;
  const session: Session = {
    type: 'session',
    payload: sessionPayload,
    signature: signature,
  };

  return {
    session,
    sign: (actionPayload: ActionPayload) => {
      return signTypedData({
        privateKey: Buffer.from(sessionWallet.privateKey.slice(2), 'hex'),
        data: getEIP712SignableAction(actionPayload),
        version: SignTypedDataVersion.V4,
      });
    },
  };
}

export async function getTestTopic(version?: 'v1' | 'v2'): Promise<{
  community: CommunityInstance;
  topic: TopicInstance;
}> {
  const community = await getTestChain(version);

  const [topic, created] = await models.Topic.findOrCreate({
    where: {
      chain_id: community.id,
    },
    defaults: {
      name: 'Test Topic',
    },
  });

  return { community, topic };
}

export async function getTestThread(): Promise<{
  community: CommunityInstance;
  address: AddressInstance;
  topic: TopicInstance;
  thread: ThreadInstance;
}> {
  const { community, topic } = await getTestTopic();
  const { address } = await getTestAddress();

  const body = 'random body';
  const [thread] = await models.Thread.findOrCreate({
    where: {
      address_id: address.id,
      chain: community.id,
    },
    defaults: {
      title: encodeURIComponent('random title'),
      body: encodeURIComponent(body),
      kind: 'discussion',
      topic_id: topic.id,
      plaintext: body,
    },
  });

  return { community, address, topic, thread };
}

export async function getTestComment(): Promise<{
  community: CommunityInstance;
  address: AddressInstance;
  topic: TopicInstance;
  thread: ThreadInstance;
  comment: CommentInstance;
}> {
  const { community, address, topic, thread } = await getTestThread();

  const text = 'random text';
  const [comment] = await models.Comment.findOrCreate({
    where: {
      chain: thread.chain,
      address_id: thread.address_id,
      text: encodeURIComponent(text),
      plaintext: text,
      thread_id: thread.id,
    },
  });

  return { community, address, topic, thread, comment };
}
