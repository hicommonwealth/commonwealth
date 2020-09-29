/* eslint-disable no-unused-expressions */
import chai from 'chai';
import 'chai/register-should';
import moment from 'moment';
import wallet from 'ethereumjs-wallet';
import { Keyring } from '@polkadot/api';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { NotificationCategory } from 'models';
import { factory, formatFilename } from '../../shared/logging';
import app from '../../server-test';
import models from '../../server/database';
const ethUtil = require('ethereumjs-util');
const log = factory.getLogger(formatFilename(__filename));

export const generateEthAddress = () => {
  const keypair = wallet.generate();
  const address = `0x${keypair.getAddress().toString('hex')}`;
  return { keypair, address };
};

export const createAndVerifyAddress = async ({ chain }, mnemonic = 'Alice') => {
  if (chain === 'ethereum') {
    const { keypair, address } = generateEthAddress();
    let res = await chai.request.agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address, chain });
    const address_id = res.body.result.id;
    const token = res.body.result.verification_token;
    const msgHash = ethUtil.hashPersonalMessage(Buffer.from(token));
    const sig = ethUtil.ecsign(msgHash, Buffer.from(keypair.getPrivateKey(), 'hex'));
    const signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
    res = await chai.request.agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, signature });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return { address_id, address, user_id, email };
  }
  if (chain === 'edgeware') {
    const keyPair = new Keyring({
      type: 'sr25519',
      ss58Format: 42,
    }).addFromMnemonic(mnemonic);
    const address = keyPair.address;
    let res = await chai.request.agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({ address: keyPair.address, chain });
    const address_id = res.body.result.id;
    const token = res.body.result.verification_token;
    const u8aSignature = keyPair.sign(stringToU8a(token));
    const signature = u8aToHex(u8aSignature).slice(2);
    res = await chai.request.agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({ address, chain, signature });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return { address_id, address, user_id, email };
  }
  throw new Error('invalid chain');
};

export const updateProfile = async ({ chain, address, data, jwt, skipChainFetch }) => {
  const res = await chai.request.agent(app)
    .post('/api/updateProfile')
    .set('Accept', 'application/json')
    .send({ address, chain, data, jwt, skipChainFetch });
  return res.body;
};

export interface ThreadArgs {
  jwt: any,
  address: string,
  kind: string,
  chainId: string,
  communityId: string,
  title: string,
  topicName?: string,
  topicId?: number,
  body?: string,
  url?: string,
  attachments?: string[],
  mentions?: string[],
  readOnly?: boolean
}
export const createThread = async (args: ThreadArgs) => {
  const { chainId, communityId, address, jwt, title, body, topicName, topicId,
    readOnly, kind, url, mentions, attachments } = args;
  const timestamp = moment();
  const firstVersion : any = { timestamp, body };
  const versionHistory : string = JSON.stringify(firstVersion);
  const res = await chai.request.agent(app)
    .post('/api/createThread')
    .set('Accept', 'application/json')
    .send({
      'author_chain': chainId,
      'chain': communityId ? undefined : chainId,
      'community': communityId,
      'address': address,
      'title': encodeURIComponent(title),
      'body': encodeURIComponent(body),
      'kind': kind,
      'versionHistory': versionHistory,
      'attachments[]': undefined,
      'topic_name': topicName,
      'topic_id': topicId,
      'mentions[]': mentions,
      'url': url,
      'readOnly': readOnly || false,
      'jwt': jwt,
    });
  return res.body;
};

export interface CommentArgs {
  chain?: string;
  community?: string;
  address: string;
  jwt: any;
  text: any;
  parentCommentId?: any;
  root_id?: any;
  mentions?: any;
}
export const createComment = async (args: CommentArgs) => {
  const { chain, community, address, jwt, text, parentCommentId, root_id, mentions } = args;
  const timestamp = moment();
  const firstVersion : any = { timestamp, body: text };
  const versionHistory : string = JSON.stringify(firstVersion);
  const res = await chai.request.agent(app)
    .post('/api/createComment')
    .set('Accept', 'application/json')
    .send({
      'author_chain': chain,
      'chain': community ? undefined : chain,
      'community': community,
      'address': address,
      'parent_id': parentCommentId,
      'root_id': root_id,
      'attachments[]': undefined,
      'text': text,
      'versionHistory': versionHistory,
      'jwt': jwt,
      'mentions[]': mentions,
    });
  return res.body;
};

export interface EditCommentArgs {
  jwt: any;
  comment_id: Number;
  text: any;
  address?: string;
  chain?: string;
  community?: string;
}

export const editComment = async (args: EditCommentArgs) => {
  const { jwt, text, comment_id, chain, community, address } = args;
  const recentEdit : any = { timestamp: moment(), body: text };
  const versionHistory = JSON.stringify(recentEdit);
  const res = await chai.request.agent(app)
    .post('/api/editComment')
    .set('Accept', 'application/json')
    .send({
      'id': comment_id,
      'author_chain': chain,
      'address': address,
      'body': encodeURIComponent(text),
      'version_history': versionHistory,
      'attachments[]': undefined,
      'jwt': jwt,
      'chain': community ? undefined : chain,
      'community': community,
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
  const { jwt, address, id, name, description, featured_order, chain, community } = args;
  const res = await chai.request.agent(app)
    .post('/api/editTopic')
    .set('Accept', 'application/json')
    .send({
      'id': id,
      'community': community,
      'chain': chain,
      'name': name,
      'description': description,
      'featured_order': featured_order,
      'address': address,
      'jwt': jwt
    });
  return res.body;
};

export const createWebhook = async ({ chain, webhookUrl, jwt }) => {
  const res = await chai.request.agent(app)
    .post('/api/createWebhook')
    .set('Accept', 'application/json')
    .send({ chain, webhookUrl, auth: true, jwt });
  return res.body;
};

export interface AssignRoleArgs {
  address_id: number;
  chainOrCommObj: {
    chain_id?: string,
    offchain_community_id?: string,
  };
  role: string;
}

export const assignRole = async (args: AssignRoleArgs) => {
  const role = await models['Role'].create({
    ...args.chainOrCommObj,
    address_id: args.address_id,
    permission: args.role,
  });

  return role;
};

export interface SubscriptionArgs {
  object_id: string | number;
  jwt: any;
  is_active: boolean;
  category: string;
}
export const createSubscription = async (args: SubscriptionArgs) => {
  const res = await chai.request(app)
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
  creator_address: string,
  creator_chain: string,
  description: string;
  default_chain: string;
  isAuthenticatedForum: string;
  invitesEnabled: string;
  privacyEnabled: string;
}

export const createCommunity = async (args: CommunityArgs) => {
  const res = await chai.request(app)
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
  const res = await chai.request(app)
    .post('/api/createInvite')
    .set('Accept', 'application/json')
    .send({ ...args });
  const invite = res.body;
  return invite;
};
