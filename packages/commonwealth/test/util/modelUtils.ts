/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Action,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ChainBase, ChainNetwork } from '@hicommonwealth/core';
import {
  SignTypedDataVersion,
  personalSign,
  signTypedData,
} from '@metamask/eth-sig-util';
import { Keyring } from '@polkadot/api';
import { stringToU8a } from '@polkadot/util';
import chai from 'chai';
import wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
import { configure as configureStableStringify } from 'safe-stable-stringify';
import * as siwe from 'siwe';
import { createRole, findOneRole } from '../../server/util/roles';

import { createCanvasSessionPayload } from '../../shared/canvas';

import type { Role } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import Web3 from 'web3-utils';
import app from '../../server-test';

import { Link, LinkSource, ThreadAttributes } from '@hicommonwealth/model';
import {
  TEST_BLOCK_INFO_BLOCKHASH,
  TEST_BLOCK_INFO_STRING,
  createSiweMessage,
  getEIP712SignableAction,
} from '../../shared/adapters/chain/ethereum/keys';

const sortedStringify = configureStableStringify({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

export const generateEthAddress = () => {
  const keypair = wallet.generate();
  const lowercaseAddress = `0x${keypair.getAddress().toString('hex')}`;
  const address = Web3.toChecksumAddress(lowercaseAddress);
  return { keypair, address };
};

export const getTopicId = async ({ chain }) => {
  const res = await chai.request
    .agent(app)
    .get('/api/topics')
    .set('Accept', 'application/json')
    .query({
      community_id: chain,
    });
  const topicId = res.body.result[0].id;
  return topicId;
};

export const createAndVerifyAddress = async ({ chain }, mnemonic = 'Alice') => {
  if (chain === 'ethereum' || chain === 'alex') {
    const wallet_id = 'metamask';
    const { keypair, address } = generateEthAddress();
    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({
        address,
        community_id: chain,
        wallet_id,
        block_info: TEST_BLOCK_INFO_STRING,
      });
    const address_id = res.body.result.id;
    const chain_id = chain === 'alex' ? '3' : '1'; // use ETH mainnet for testing except alex
    const sessionWallet = ethers.Wallet.createRandom();
    const timestamp = 1665083987891;
    const sessionPayload = createCanvasSessionPayload(
      'ethereum' as ChainBase,
      chain_id,
      address,
      sessionWallet.address,
      timestamp,
      TEST_BLOCK_INFO_BLOCKHASH,
    );
    const nonce = siwe.generateNonce();
    const domain = 'https://commonwealth.test';
    const siweMessage = createSiweMessage(sessionPayload, domain, nonce);
    const signatureData = personalSign({
      privateKey: keypair.getPrivateKey(),
      data: siweMessage,
    });
    const signature = `${domain}/${nonce}/${signatureData}`;
    const session: Session = {
      type: 'session',
      payload: sessionPayload,
      signature: signature,
    };
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({
        address,
        community_id: chain,
        chain_id,
        signature,
        wallet_id,
        session_public_address: sessionWallet.address,
        session_timestamp: timestamp,
        session_block_data: TEST_BLOCK_INFO_STRING,
      });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return {
      address_id,
      address,
      user_id,
      email,
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
  if (chain === 'edgeware') {
    const wallet_id = 'polkadot';
    const keyPair = new Keyring({
      type: 'sr25519',
      ss58Format: 7,
    }).addFromMnemonic(mnemonic);
    const address = keyPair.address;
    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address: keyPair.address, community_id: chain, wallet_id });

    // generate session wallet
    const sessionKeyring = new Keyring();
    const sessionWallet = sessionKeyring.addFromUri(
      mnemonicGenerate(),
      {},
      'ed25519',
    );
    const chain_id = ChainNetwork.Edgeware;
    const timestamp = 1665083987891;
    const sessionPayload: SessionPayload = createCanvasSessionPayload(
      'substrate' as ChainBase,
      chain_id,
      address,
      sessionWallet.address,
      timestamp,
      TEST_BLOCK_INFO_BLOCKHASH,
    );
    const signature = keyPair.sign(
      stringToU8a(sortedStringify(sessionPayload)),
    );
    const session: Session = {
      type: 'session',
      payload: sessionPayload,
      signature: new Buffer(signature).toString('hex'),
    };

    const address_id = res.body.result.id;
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, community_id: chain, signature, wallet_id });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return {
      address_id,
      address,
      user_id,
      email,
      session,
      sessionSigner: keyPair,
      sign: (actionPayload: ActionPayload) => {
        const signatureBytes = sessionWallet.sign(
          stringToU8a(sortedStringify(actionPayload)),
        );
        return new Buffer(signatureBytes).toString('hex');
      },
    };
  }
  throw new Error('invalid chain');
};

export const updateProfile = async ({
  chain,
  address,
  data,
  jwt,
  skipChainFetch,
}) => {
  const res = await chai.request
    .agent(app)
    .post('/api/updateProfile')
    .set('Accept', 'application/json')
    .send({ address, chain, data, jwt, skipChainFetch });
  return res.body;
};

export interface ThreadArgs {
  jwt: any;
  address: string;
  kind: string;
  stage?: string;
  chainId: string;
  title: string;
  topicId?: number;
  body?: string;
  url?: string;
  readOnly?: boolean;
  session: Session;
  sign: (actionPayload: ActionPayload) => string;
}

export const createThread = async (
  args: ThreadArgs,
): Promise<{ status: string; result?: ThreadAttributes; error?: Error }> => {
  const {
    chainId,
    address,
    jwt,
    title,
    body,
    topicId,
    readOnly,
    kind,
    url,
    session,
    sign,
  } = args;

  const actionPayload: ActionPayload = {
    app: session.payload.app,
    block: session.payload.block,
    call: 'thread',
    callArgs: {
      community: chainId || '',
      title: encodeURIComponent(title),
      body: encodeURIComponent(body),
      link: url || '',
      topic: topicId || '',
    },
    chain: 'eip155:1',
    from: session.payload.from,
    timestamp: Date.now(),
  };
  const action: Action = {
    type: 'action',
    payload: actionPayload,
    session: session.payload.sessionAddress,
    signature: sign(actionPayload),
  };
  const canvas_session = sortedStringify(session);
  const canvas_action = sortedStringify(action);
  const canvas_hash = ''; // getActionHash(action)

  const res = await chai.request
    .agent(app)
    .post('/api/threads')
    .set('Accept', 'application/json')
    .send({
      author_chain: chainId,
      chain: chainId,
      address,
      title: encodeURIComponent(title),
      body: encodeURIComponent(body),
      kind,
      topic_id: topicId,
      url,
      readOnly: readOnly || false,
      jwt,
      canvas_action,
      canvas_session,
      canvas_hash,
    });
  return res.body;
};

type createDeleteLinkArgs = {
  thread_id: number;
  links: Link[];
  jwt: any;
};
export const createLink = async (args: createDeleteLinkArgs) => {
  const res = await chai.request
    .agent(app)
    .post('/api/linking/addThreadLinks')
    .set('Accept', 'application/json')
    .send(args);
  return res.body;
};

export const deleteLink = async (args: createDeleteLinkArgs) => {
  const res = await chai.request
    .agent(app)
    .delete('/api/linking/deleteLinks')
    .set('Accept', 'application/json')
    .send(args);
  return res.body;
};

type getLinksArgs = {
  thread_id?: number;
  linkType?: LinkSource[];
  link?: Link;
  jwt: any;
};

export const getLinks = async (args: getLinksArgs) => {
  const res = await chai.request
    .agent(app)
    .post('/api/linking/getLinks')
    .set('Accept', 'application/json')
    .send(args);
  return res.body;
};

export interface CommentArgs {
  chain: string;
  address: string;
  jwt: any;
  text: any;
  parentCommentId?: any;
  thread_id?: any;
  session: Session;
  sign: (actionPayload: ActionPayload) => string;
}

export const createComment = async (args: CommentArgs) => {
  const {
    chain,
    address,
    jwt,
    text,
    parentCommentId,
    thread_id,
    session,
    sign,
  } = args;

  const actionPayload: ActionPayload = {
    app: session.payload.app,
    block: session.payload.block,
    call: 'comment',
    callArgs: {
      body: text,
      thread_id,
      parent_comment_id: parentCommentId,
    },
    chain: 'eip155:1',
    from: session.payload.from,
    timestamp: Date.now(),
  };
  const action: Action = {
    type: 'action',
    payload: actionPayload,
    session: session.payload.sessionAddress,
    signature: sign(actionPayload),
  };
  const canvas_session = sortedStringify(session);
  const canvas_action = sortedStringify(action);
  const canvas_hash = ''; // getActionHash(action)
  // TODO

  const res = await chai.request
    .agent(app)
    .post(`/api/threads/${thread_id}/comments`)
    .set('Accept', 'application/json')
    .send({
      author_chain: chain,
      chain,
      address,
      parent_id: parentCommentId,
      text,
      jwt,
      canvas_action,
      canvas_session,
      canvas_hash,
    });
  return res.body;
};

export interface EditCommentArgs {
  jwt: any;
  comment_id: number;
  text: any;
  address?: string;
  chain?: string;
  community?: string;
}

export const editComment = async (args: EditCommentArgs) => {
  const { jwt, text, comment_id, chain, community, address } = args;
  const res = await chai.request
    .agent(app)
    .patch(`/api/comments/${comment_id}`)
    .set('Accept', 'application/json')
    .send({
      author_chain: chain,
      address,
      body: encodeURIComponent(text),
      jwt,
      chain: community ? undefined : chain,
      community,
    });
  return res.body;
};

export interface CreateReactionArgs {
  author_chain: string;
  chain: string;
  address: string;
  reaction: string;
  jwt: string;
  comment_id?: number;
  thread_id?: number;
  session: Session;
  sign: (actionPayload: ActionPayload) => string;
}

export const createReaction = async (args: CreateReactionArgs) => {
  const {
    chain,
    address,
    jwt,
    author_chain,
    reaction,
    comment_id,
    thread_id,
    session,
    sign,
  } = args;

  const actionPayload: ActionPayload = {
    app: session.payload.app,
    block: session.payload.block,
    call: 'reactComment',
    callArgs: { comment_id, value: reaction },
    chain: 'eip155:1',
    from: session.payload.from,
    timestamp: Date.now(),
  };
  const action: Action = {
    type: 'action',
    payload: actionPayload,
    session: session.payload.sessionAddress,
    signature: sign(actionPayload),
  };
  const canvas_session = sortedStringify(session);
  const canvas_action = sortedStringify(action);
  const canvas_hash = ''; // getActionHash(action)
  // TODO

  const res = await chai.request
    .agent(app)
    .post(`/api/comments/${comment_id}/reactions`)
    .set('Accept', 'application/json')
    .send({
      chain,
      address,
      reaction,
      comment_id,
      author_chain,
      jwt,
      thread_id,
      canvas_session,
      canvas_action,
      canvas_hash,
    });
  return res.body;
};

export interface CreateThreadReactionArgs {
  author_chain: string;
  chain: string;
  address: string;
  reaction: string;
  jwt: string;
  thread_id?: number;
  session: Session;
  sign: (actionPayload: ActionPayload) => string;
}

export const createThreadReaction = async (args: CreateThreadReactionArgs) => {
  const {
    chain,
    address,
    jwt,
    author_chain,
    reaction,
    thread_id,
    session,
    sign,
  } = args;

  const actionPayload: ActionPayload = {
    app: session.payload.app,
    block: session.payload.block,
    call: 'reactThread',
    callArgs: { thread_id, value: reaction },
    chain: 'eip155:1',
    from: session.payload.from,
    timestamp: Date.now(),
  };
  const action: Action = {
    type: 'action',
    payload: actionPayload,
    session: session.payload.sessionAddress,
    signature: sign(actionPayload),
  };
  const canvas_session = sortedStringify(session);
  const canvas_action = sortedStringify(action);
  const canvas_hash = ''; // getActionHash(action)
  // TODO

  const res = await chai.request
    .agent(app)
    .post(`/api/threads/${thread_id}/reactions`)
    .set('Accept', 'application/json')
    .send({
      chain,
      address,
      reaction,
      author_chain,
      jwt,
      thread_id,
      canvas_session,
      canvas_action,
      canvas_hash,
    });
  return res.body;
};

export interface EditTopicArgs {
  jwt: any;
  address: string;
  id: number;
  name?: string;
  description?: string;
  featured_order?: boolean;
  chain?: string;
  community?: string;
}

export const editTopic = async (args: EditTopicArgs) => {
  const {
    jwt,
    address,
    id,
    name,
    description,
    featured_order,
    chain,
    community,
  } = args;
  const res = await chai.request
    .agent(app)
    .post(`/api/topics/${id}`)
    .set('Accept', 'application/json')
    .send({
      id,
      community,
      chain,
      name,
      description,
      featured_order,
      address,
      jwt,
    });
  return res.body;
};

export const createWebhook = async ({ chain, webhookUrl, jwt }) => {
  const res = await chai.request
    .agent(app)
    .post('/api/createWebhook')
    .set('Accept', 'application/json')
    .send({ chain, webhookUrl, auth: true, jwt });
  return res.body;
};

export interface AssignRoleArgs {
  address_id: number;
  chainOrCommObj: {
    chain_id: string;
  };
  role: Role;
}

export const updateRole = async (args: AssignRoleArgs) => {
  const currentRole = await findOneRole(
    models,
    { where: { address_id: args.address_id } },
    args.chainOrCommObj.chain_id,
  );
  let role;
  // Can only be a promotion
  if (currentRole.toJSON().permission === 'member') {
    role = await createRole(
      models,
      args.address_id,
      args.chainOrCommObj.chain_id,
      args.role,
    );
  }
  // Can be demoted or promoted
  else if (currentRole.toJSON().permission === 'moderator') {
    // Demotion
    if (args.role === 'member') {
      role = await models['RoleAssignment'].destroy({
        where: {
          community_role_id: currentRole.toJSON().community_role_id,
          address_id: args.address_id,
        },
      });
    }
    // Promotion
    else if (args.role === 'admin') {
      role = await createRole(
        models,
        args.address_id,
        args.chainOrCommObj.chain_id,
        args.role,
      );
    }
  }
  // If current role is admin, you cannot change it is the assumption
  else {
    return null;
  }
  if (!role) return null;
  return role;
};

export interface SubscriptionArgs {
  jwt: any;
  is_active: boolean;
  category: string;
  chain_id: string;
}

export const createSubscription = async (args: SubscriptionArgs) => {
  const res = await chai
    .request(app)
    .post('/api/createSubscription')
    .set('Accept', 'application/json')
    .send({ ...args });
  const subscription = res.body.result;
  return subscription;
};

export interface CommunityArgs {
  jwt: any;
  id: string;
  name: string;
  creator_address: string;
  creator_chain: string;
  description: string;
  default_chain: string;
  isAuthenticatedForum: string;
  privacyEnabled: string;
}

export const createCommunity = async (args: CommunityArgs) => {
  const res = await chai
    .request(app)
    .post('/api/createCommunity')
    .set('Accept', 'application/json')
    .send({ ...args });
  const community = res.body.result;
  return community;
};

export interface JoinCommunityArgs {
  jwt: string;
  address_id: number;
  address: string;
  chain: string;
  originChain: string;
}

export const joinCommunity = async (args: JoinCommunityArgs) => {
  const { jwt, address, chain, originChain, address_id } = args;
  try {
    await chai.request
      .agent(app)
      .post('/api/linkExistingAddressToCommunity')
      .set('Accept', 'application/json')
      .send({
        address,
        community_id: chain,
        originChain,
        jwt,
      });
  } catch (e) {
    console.error('Failed to link an existing address to a chain');
    console.error(e);
    return false;
  }

  try {
    await createRole(models, address_id, chain, 'member', false);
  } catch (e) {
    console.error('Failed to create a role for a new member');
    console.error(e);
    return false;
  }

  try {
    await chai.request
      .agent(app)
      .post('/api/setDefaultRole')
      .set('Accept', 'application/json')
      .send({
        address,
        author_chain: chain,
        chain,
        jwt,
        auth: 'true',
      });
  } catch (e) {
    console.error('Failed to set default role');
    console.error(e);
    return false;
  }

  return true;
};
