/* eslint-disable no-unused-expressions */
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Keyring } from '@polkadot/api';
import { stringToU8a } from '@polkadot/util';
import type BN from 'bn.js';
import chai from 'chai';
import 'chai/register-should';
import { BalanceType, ChainNetwork } from 'common-common/src/types';
import wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
import { createRole, findOneRole } from 'server/util/roles';

import type { IChainNode } from 'token-balance-cache/src/index';
import { BalanceProvider } from 'token-balance-cache/src/index';
import { constructCanvasMessage } from 'shared/adapters/shared';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import Web3 from 'web3-utils';
import app from '../../server-test';
import models from '../../server/database';
import { factory, formatFilename } from 'common-common/src/logging';
import type { Role } from '../../server/models/role';

import {
  constructTypedCanvasMessage,
  TEST_BLOCK_INFO_STRING,
  TEST_BLOCK_INFO_BLOCKHASH,
} from '../../shared/adapters/chain/ethereum/keys';
import { Link, LinkSource } from 'server/models/thread';

const log = factory.getLogger(formatFilename(__filename));

export const generateEthAddress = () => {
  const keypair = wallet.generate();
  const lowercaseAddress = `0x${keypair.getAddress().toString('hex')}`;
  const address = Web3.toChecksumAddress(lowercaseAddress);
  return { keypair, address };
};

export const createAndVerifyAddress = async ({ chain }, mnemonic = 'Alice') => {
  if (chain === 'ethereum' || chain === 'alex') {
    const wallet_id = 'metamask';
    const { keypair, address } = generateEthAddress();
    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, wallet_id, block_info: TEST_BLOCK_INFO_STRING });
    const address_id = res.body.result.id;
    const token = res.body.result.verification_token;
    const chain_id = chain === 'alex' ? '3' : '1'; // use ETH mainnet for testing except alex
    const sessionWallet = ethers.Wallet.createRandom();
    const timestamp = 1665083987891;
    const message = constructCanvasMessage(
      'ethereum',
      chain_id,
      address,
      sessionWallet.address,
      timestamp,
      TEST_BLOCK_INFO_BLOCKHASH
    );
    const data = constructTypedCanvasMessage(message);
    const privateKey = keypair.getPrivateKey();
    const signature = signTypedData({
      privateKey,
      data,
      version: SignTypedDataVersion.V4,
    });
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({
        address,
        chain,
        chain_id,
        signature,
        wallet_id,
        session_public_address: sessionWallet.address,
        session_timestamp: timestamp,
        session_block_data: TEST_BLOCK_INFO_STRING,
      });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return { address_id, address, user_id, email };
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
      .send({ address: keyPair.address, chain, wallet_id });

    // generate session wallet
    const sessionKeyring = new Keyring();
    const sessionWallet = sessionKeyring.addFromUri(
      mnemonicGenerate(),
      {},
      'ed25519'
    );
    const chain_id = ChainNetwork.Edgeware;
    const timestamp = 1665083987891;
    const message = constructCanvasMessage(
      'ethereum',
      chain_id,
      address,
      sessionWallet.address,
      timestamp,
      TEST_BLOCK_INFO_BLOCKHASH
    );

    const signature = keyPair.sign(stringToU8a(JSON.stringify(message)));

    const address_id = res.body.result.id;
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, signature, wallet_id });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return { address_id, address, user_id, email };
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
  topicName?: string;
  topicId?: number;
  body?: string;
  url?: string;
  attachments?: string[];
  readOnly?: boolean;
}

export const createThread = async (args: ThreadArgs) => {
  const {
    chainId,
    address,
    jwt,
    title,
    body,
    topicName,
    topicId,
    readOnly,
    kind,
    url,
  } = args;
  const res = await chai.request
    .agent(app)
    .post('/api/createThread')
    .set('Accept', 'application/json')
    .send({
      author_chain: chainId,
      chain: chainId,
      address,
      title: encodeURIComponent(title),
      body: encodeURIComponent(body),
      kind,
      'attachments[]': undefined,
      topic_name: topicName,
      topic_id: topicId,
      url,
      readOnly: readOnly || false,
      jwt,
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
}

export const createComment = async (args: CommentArgs) => {
  const { chain, address, jwt, text, parentCommentId, thread_id } = args;
  const res = await chai.request
    .agent(app)
    .post(`/api/threads/${thread_id}/comments`)
    .set('Accept', 'application/json')
    .send({
      author_chain: chain,
      chain,
      address,
      parent_id: parentCommentId,
      'attachments[]': undefined,
      text,
      jwt,
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
      'attachments[]': undefined,
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
  comment_id: number;
}

export const createReaction = async (args: CreateReactionArgs) => {
  const { chain, address, jwt, author_chain, reaction, comment_id } = args;
  const res = await chai.request
    .agent(app)
    .post('/api/createReaction')
    .set('Accept', 'application/json')
    .send({
      chain,
      address,
      reaction,
      comment_id,
      author_chain,
      jwt,
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
    .post('/api/editTopic')
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
    args.chainOrCommObj.chain_id
  );
  let role;
  // Can only be a promotion
  if (currentRole.toJSON().permission === 'member') {
    role = await createRole(
      models,
      args.address_id,
      args.chainOrCommObj.chain_id,
      args.role
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
        args.role
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
  object_id: string | number;
  jwt: any;
  is_active: boolean;
  category: string;
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

// always prune both token and non-token holders asap
export class MockTokenBalanceProvider extends BalanceProvider<
  any,
  {
    tokenAddress: string;
    contractType: string;
  }
> {
  public name = 'eth-token';
  public opts = {
    tokenAddress: 'string',
    contractType: 'string',
  };
  public validBases = [BalanceType.Ethereum];
  public balanceFn: (tokenAddress: string, userAddress: string) => Promise<BN>;

  public async getExternalProvider(
    node: IChainNode,
    opts: { tokenAddress: string; contractType: string }
  ): Promise<any> {
    return;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: { tokenAddress: string; contractType: string }
  ): Promise<string> {
    if (this.balanceFn) {
      const bal = await this.balanceFn(opts.tokenAddress, address);
      return bal.toString();
    } else {
      throw new Error('unable to fetch token balance');
    }
  }
}

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
      .post('/api/linkExistingAddressToChain')
      .set('Accept', 'application/json')
      .send({
        address,
        chain,
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
