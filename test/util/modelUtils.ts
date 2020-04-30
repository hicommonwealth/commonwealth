/* eslint-disable no-unused-expressions */
import chai from 'chai';
import 'chai/register-should';
import moment from 'moment';
import wallet from 'ethereumjs-wallet';
import { NotificationCategory } from 'models';
import { factory, formatFilename } from '../../server/util/logging';
import app from '../../server-test';
import models from '../../server/database';
const ethUtil = require('ethereumjs-util');
const log = factory.getLogger(formatFilename(__filename));

export const createAndVerifyAddress = async ({ chain }) => {
  const keypair = wallet.generate();
  const address = `0x${keypair.getAddress().toString('hex')}`;
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
};

interface ThreadArgs {
  chain?: string;
  community?: string;
  address: string;
  jwt: any;
  title: string;
  body: any;
  tags?: string[];
  privacy?: boolean;
  readOnly?: boolean;
}
export const createThread = async (args: ThreadArgs) => {
  const { chain, community, address, jwt, title, body, tags, privacy, readOnly } = args;
  const timestamp = moment();
  const firstVersion : any = { timestamp, body };
  const versionHistory : string = JSON.stringify(firstVersion);
  const res = await chai.request.agent(app)
    .post('/api/createThread')
    .set('Accept', 'application/json')
    .send({
      'author_chain': chain,
      'chain': community ? undefined : chain,
      'community': community,
      'address': address,
      'title': encodeURIComponent(title),
      'body': encodeURIComponent(body),
      'kind': 'forum',
      'versionHistory': versionHistory,
      'attachments[]': undefined,
      'tags[]': tags || 'tag',
      'url': undefined,
      'privacy': privacy || false,
      'readOnly': readOnly || false,
      'jwt': jwt,
    });
  return res.body;
};

interface CommentArgs {
  chain?: string;
  community?: string;
  address: string;
  jwt: any;
  text: any;
  parentCommentId?: any;
  proposalIdentifier?: any;
}
export const createComment = async (args: CommentArgs) => {
  const { chain, community, address, jwt, text, parentCommentId, proposalIdentifier } = args;
  const timestamp = moment();
  const firstVersion : any = { timestamp, body: text };
  const versionHistory : string = JSON.stringify(firstVersion);
  const res = await chai.request.agent(app)
    .post('/api/createComment')
    .set('Accept', 'application/json')
    .send({
      'author_chain': chain,
      'chain': chain,
      'community': community,
      'address': address,
      'parent_id': parentCommentId,
      'root_id': proposalIdentifier,
      'attachments[]': undefined,
      'text': encodeURIComponent(text),
      'versionHistory': versionHistory,
      'jwt': jwt,
    });
  return res.body;
};

interface EditCommentArgs {
  jwt: any;
  comment_id: Number;
  text: any;
}
export const editComment = async (args: EditCommentArgs) => {
  const { jwt, text, comment_id } = args;
  const recentEdit : any = { timestamp: moment(), body: text };
  const versionHistory = JSON.stringify(recentEdit);
  const res = await chai.request.agent(app)
    .post('/api/editComment')
    .set('Accept', 'application/json')
    .send({
      'id': comment_id,
      'body': encodeURIComponent(text),
      'version_history': versionHistory,
      'attachments[]': undefined,
      'jwt': jwt,
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

export const assignAdmin = async (address_id, chainOrCommObj) => {
  const admin = await models['Role'].create({
    ...chainOrCommObj,
    address_id,
    permission: 'admin',
  });

  return admin;
};

interface SubscriptionArgs {
  object_id: string | number;
  jwt: any;
  is_active: boolean;
  category: string;
}
export const createSubscription = async (args: SubscriptionArgs) => {
  const { jwt, object_id, is_active, category } = args;
  const res = await chai.request(app)
    .post('/api/createSubscription')
    .set('Accept', 'application/json')
    .send({ jwt, category, is_active, object_id, });
  const subscription = res.body.result;
  return subscription;
};
