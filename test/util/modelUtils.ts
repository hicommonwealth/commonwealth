/* eslint-disable no-unused-expressions */
import chai from 'chai';
import 'chai/register-should';
import Web3 from 'web3';
import BN from 'bn.js';
import wallet from 'ethereumjs-wallet';
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Keyring } from '@polkadot/api';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { factory, formatFilename } from '../../shared/logging';
import app from '../../server-test';
import models from '../../server/database';
import { Permission } from '../../server/models/role';
import { TokenBalanceProvider } from '../../server/util/tokenBalanceCache';
import { constructTypedMessage } from '../../shared/adapters/chain/ethereum/keys';

const log = factory.getLogger(formatFilename(__filename));

export const generateEthAddress = () => {
  const keypair = wallet.generate();
  const lowercaseAddress = `0x${keypair.getAddress().toString('hex')}`;
  const address = Web3.utils.toChecksumAddress(lowercaseAddress);
  return { keypair, address };
};

export const createAndVerifyAddress = async ({ chain }, mnemonic = 'Alice') => {
  if (chain === 'ethereum' || chain === 'alex') {
    const { keypair, address } = generateEthAddress();
    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address, chain });
    const address_id = res.body.result.id;
    const token = res.body.result.verification_token;
    const chain_id = chain === 'alex' ? 3 : 1;   // use ETH mainnet for testing except alex
    const data = constructTypedMessage(chain_id, token);
    const privateKey = Buffer.from(keypair.getPrivateKey(), 'hex');
    const signature = signTypedData({ privateKey, data, version: SignTypedDataVersion.V4 });
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, signature });
    console.log(JSON.stringify(res.body));
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return { address_id, address, user_id, email };
  }
  if (chain === 'edgeware') {
    const keyPair = new Keyring({
      type: 'sr25519',
      ss58Format: 7,
    }).addFromMnemonic(mnemonic);
    const address = keyPair.address;
    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address: keyPair.address, chain });
    const address_id = res.body.result.id;
    const token = res.body.result.verification_token;
    const u8aSignature = keyPair.sign(stringToU8a(token));
    const signature = u8aToHex(u8aSignature).slice(2);
    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, signature });
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
  stage: string;
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
    stage,
    url,
    attachments,
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

export interface CommentArgs {
  chain: string;
  address: string;
  jwt: any;
  text: any;
  parentCommentId?: any;
  root_id?: any;
}
export const createComment = async (args: CommentArgs) => {
  const { chain, address, jwt, text, parentCommentId, root_id } =
    args;
  const res = await chai.request
    .agent(app)
    .post('/api/createComment')
    .set('Accept', 'application/json')
    .send({
      author_chain: chain,
      chain,
      address,
      parent_id: parentCommentId,
      root_id,
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
    .post('/api/editComment')
    .set('Accept', 'application/json')
    .send({
      id: comment_id,
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
  role: Permission;
}

export const assignRole = async (args: AssignRoleArgs) => {
  const role = await models['Role'].create({
    ...args.chainOrCommObj,
    address_id: args.address_id,
    permission: args.role,
  });

  return role;
};

export const updateRole = async (args: AssignRoleArgs) => {
  const role = await models['Role'].findOne({
    where: {
      ...args.chainOrCommObj,
      address_id: args.address_id,
    },
  });
  if (!role) return null;
  role.permission = args.role;
  await role.save();
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
  invitesEnabled: string;
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

export interface InviteArgs {
  jwt: string;
  invitedEmail?: string;
  invitedAddress?: string;
  chain?: string;
  community?: string;
  address: string;
}

export const createInvite = async (args: InviteArgs) => {
  const res = await chai
    .request(app)
    .post('/api/createInvite')
    .set('Accept', 'application/json')
    .send({ ...args });
  const invite = res.body;
  return invite;
};

export class MockTokenBalanceProvider extends TokenBalanceProvider {
  public balanceFn: (tokenAddress: string, userAddress: string) => Promise<BN>;

  public async getEthTokenBalance(
    tokenAddress: string,
    userAddress: string
  ): Promise<BN> {
    if (this.balanceFn) {
      return this.balanceFn(tokenAddress, userAddress);
    } else {
      throw new Error('unable to fetch token balance');
    }
  }
}
