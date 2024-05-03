/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import type {
  Action,
  Awaitable,
  Message,
  Session,
  SessionSigner,
  Signature,
} from '@canvas-js/interfaces';
import type {
  CommunityAttributes,
  DB,
  Link,
  LinkSource,
  Role,
  ThreadAttributes,
} from '@hicommonwealth/model';
import { encode } from '@ipld/dag-json';
import { sha256 } from '@noble/hashes/sha256';
import chai from 'chai';
import NotificationSubscription from 'client/scripts/models/NotificationSubscription';
import type { Application } from 'express';
import { SubstrateSignerCW } from 'shared/canvas/sessionSigners';
import {
  CanvasSignResult,
  CanvasSignedData,
  serializeCanvas,
  toCanvasSignedDataApiArgs,
} from 'shared/canvas/types';
import { createRole, findOneRole } from '../../server/util/roles';
import { TEST_BLOCK_INFO_STRING } from '../../shared/adapters/chain/ethereum/keys';
import { CANVAS_TOPIC } from '../../shared/canvas';

function createCanvasSignResult({ session, sign, action }): CanvasSignResult {
  const sessionMessage = {
    clock: 0,
    parents: [],
    payload: session,
    topic: CANVAS_TOPIC,
  };
  const sessionMessageSignature = sign(sessionMessage);

  const actionMessage = {
    clock: 0,
    parents: [],
    payload: action,
    topic: CANVAS_TOPIC,
  };
  const actionMessageSignature = sign(actionMessage);

  const canvasSignedData: CanvasSignedData = {
    actionMessage,
    actionMessageSignature,
    sessionMessage,
    sessionMessageSignature,
  };
  const canvasHash = Buffer.from(sha256(encode(actionMessage))).toString('hex');
  return {
    canvasSignedData,
    canvasHash,
  };
}

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
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

type createDeleteLinkArgs = {
  thread_id: number;
  links: Link[];
  jwt: any;
};

type getLinksArgs = {
  thread_id?: number;
  linkType?: LinkSource[];
  link?: Link;
  jwt: any;
};

export interface CommentArgs {
  chain: string;
  address: string;
  jwt: any;
  text: any;
  parentCommentId?: any;
  thread_id?: any;
  session: Session;
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

export interface EditCommentArgs {
  jwt: any;
  comment_id: number;
  text: any;
  address?: string;
  chain?: string;
  community?: string;
}

export interface AssignRoleArgs {
  address_id: number;
  chainOrCommObj: {
    chain_id: string;
  };
  role: Role;
}

export interface CreateReactionArgs {
  author_chain: string;
  chain: string;
  address: string;
  reaction: string;
  jwt: string;
  comment_id?: number;
  thread_id?: number;
  session: Session;
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

export interface CreateThreadReactionArgs {
  author_chain: string;
  chain: string;
  address: string;
  reaction: string;
  jwt: string;
  thread_id?: number;
  session: Session;
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

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

export interface SubscriptionArgs {
  jwt: any;
  is_active: boolean;
  category: string;
  community_id: string;
}

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

export interface JoinCommunityArgs {
  jwt: string;
  address_id: number;
  address: string;
  chain: string;
  originChain: string;
}

export interface SetSiteAdminArgs {
  user_id: number;
}

export type ModelSeeder = {
  getTopicId: (args: { chain: string }) => Promise<string>;
  createAndVerifyAddress: (
    args: { chain: string },
    mnemonic: string,
  ) => Promise<{
    address_id: string;
    address: string;
    user_id: string;
    email: string;
    session: Session;
    sessionSigner?: any;
    sign: (message: Message<Action | Session>) => Awaitable<Signature>;
  }>;
  updateProfile: (args: {
    chain: string;
    address: string;
    data: any;
    jwt: string;
    skipChainFetch: boolean;
  }) => Promise<any>;
  createThread: (
    args: ThreadArgs,
  ) => Promise<{ status: string; result?: ThreadAttributes; error?: Error }>;
  createLink: (args: createDeleteLinkArgs) => Promise<any>;
  deleteLink: (args: createDeleteLinkArgs) => Promise<any>;
  getLinks: (args: getLinksArgs) => Promise<any>;
  createComment: (args: CommentArgs) => Promise<any>;
  editComment: (args: EditCommentArgs) => Promise<any>;
  createReaction: (args: CreateReactionArgs) => Promise<any>;
  createThreadReaction: (args: CreateThreadReactionArgs) => Promise<any>;
  editTopic: (args: EditTopicArgs) => Promise<any>;
  createWebhook: (args: {
    chain: string;
    webhookUrl: string;
    jwt: string;
  }) => Promise<any>;
  updateRole: (args: AssignRoleArgs) => Promise<any>;
  createSubscription: (
    args: SubscriptionArgs,
  ) => Promise<NotificationSubscription>;
  createCommunity: (args: CommunityArgs) => Promise<CommunityAttributes>;
  joinCommunity: (args: JoinCommunityArgs) => Promise<boolean>;
  setSiteAdmin: (args: SetSiteAdminArgs) => Promise<boolean>;
};

export const modelSeeder = (app: Application, models: DB): ModelSeeder => ({
  getTopicId: async ({ chain }: { chain: string }) => {
    const res = await chai.request
      .agent(app)
      .get('/api/topics')
      .set('Accept', 'application/json')
      .query({
        community_id: chain,
      });
    const topicId = res.body.result[0].id;
    return topicId;
  },

  createAndVerifyAddress: async ({ chain }, mnemonic = 'Alice') => {
    let wallet_id: string;
    let chain_id: string;
    let sessionSigner: SessionSigner;
    if (chain === 'ethereum' || chain === 'alex') {
      wallet_id = 'metamask';
      chain_id = chain === 'alex' ? '3' : '1'; // use ETH mainnet for testing except alex
      sessionSigner = new SIWESigner({ chainId: parseInt(chain_id) });
    } else if (chain === 'edgeware') {
      wallet_id = 'polkadot';
      sessionSigner = new SubstrateSignerCW();
    } else {
      throw new Error(`invalid chain ${chain}`);
    }

    const session = await sessionSigner.getSession(CANVAS_TOPIC, {});
    const walletAddress = session.address.split(':')[2];

    let res = await chai.request
      .agent(app)
      .post('/api/createAddress')
      .set('Accept', 'application/json')
      .send({
        address: walletAddress,
        community_id: chain,
        wallet_id,
        block_info: TEST_BLOCK_INFO_STRING,
      });

    const address_id = res.body.result.id;

    res = await chai.request
      .agent(app)
      .post('/api/verifyAddress')
      .set('Accept', 'application/json')
      .send({
        address: walletAddress,
        community_id: chain,
        chain_id,
        wallet_id,
        session: serializeCanvas(session),
      });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return {
      address_id,
      address: session.address,
      user_id,
      email,
      session,
      sign: sessionSigner.sign.bind(sessionSigner),
    };
  },

  updateProfile: async ({ chain, address, data, jwt, skipChainFetch }) => {
    const res = await chai.request
      .agent(app)
      .post('/api/updateProfile')
      .set('Accept', 'application/json')
      .send({ address, chain, data, jwt, skipChainFetch });
    return res.body;
  },

  createThread: async (
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

    const action = {
      type: 'action' as const,
      address,
      blockhash: null,
      name: 'thread',
      args: {
        community: chainId || '',
        title: encodeURIComponent(title),
        body: encodeURIComponent(body),
        link: url || '',
        topic: topicId || '',
      },
      timestamp: Date.now(),
    };

    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post('/api/threads')
      .set('Accept', 'application/json')
      .send({
        author_chain: chainId,
        chain: chainId,
        address: address.split(':')[2],
        title: encodeURIComponent(title),
        body: encodeURIComponent(body),
        kind,
        topic_id: topicId,
        url,
        readOnly: readOnly || false,
        jwt,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    return res.body;
  },

  createLink: async (args: createDeleteLinkArgs) => {
    const res = await chai.request
      .agent(app)
      .post('/api/linking/addThreadLinks')
      .set('Accept', 'application/json')
      .send(args);
    return res.body;
  },

  deleteLink: async (args: createDeleteLinkArgs) => {
    const res = await chai.request
      .agent(app)
      .delete('/api/linking/deleteLinks')
      .set('Accept', 'application/json')
      .send(args);
    return res.body;
  },

  getLinks: async (args: getLinksArgs) => {
    const res = await chai.request
      .agent(app)
      .post('/api/linking/getLinks')
      .set('Accept', 'application/json')
      .send(args);
    return res.body;
  },

  createComment: async (args: CommentArgs) => {
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

    const action = {
      type: 'action' as const,
      address,
      blockhash: null,
      name: 'comment',
      args: {
        body: text,
        thread_id,
        parent_comment_id: parentCommentId || null,
      },
      timestamp: Date.now(),
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post(`/api/threads/${thread_id}/comments`)
      .set('Accept', 'application/json')
      .send({
        author_chain: chain,
        chain,
        address: address.split(':')[2],
        parent_id: parentCommentId || null,
        thread_id,
        text,
        jwt,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    return res.body;
  },

  editComment: async (args: EditCommentArgs) => {
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
  },

  createReaction: async (args: CreateReactionArgs) => {
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

    const action = {
      type: 'action' as const,
      address,
      blockhash: null,
      name: 'reactComment',
      args: { comment_id, value: reaction },
      timestamp: Date.now(),
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const walletAddress = address.split(':')[2];
    const res = await chai.request
      .agent(app)
      .post(`/api/comments/${comment_id}/reactions`)
      .set('Accept', 'application/json')
      .send({
        chain,
        address: walletAddress,
        reaction,
        comment_id,
        author_chain,
        jwt,
        thread_id,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    return res.body;
  },

  createThreadReaction: async (args: CreateThreadReactionArgs) => {
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

    const action = {
      type: 'action' as const,
      address,
      blockhash: null,
      name: 'reactThread',
      args: { thread_id, value: reaction },
      timestamp: Date.now(),
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });
    const walletAddress = address.split(':')[2];
    const res = await chai.request
      .agent(app)
      .post(`/api/threads/${thread_id}/reactions`)
      .set('Accept', 'application/json')
      .send({
        chain,
        address: walletAddress,
        reaction,
        author_chain,
        jwt,
        thread_id,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    return res.body;
  },

  editTopic: async (args: EditTopicArgs) => {
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
  },

  createWebhook: async ({ chain, webhookUrl, jwt }) => {
    const res = await chai.request
      .agent(app)
      .post('/api/createWebhook')
      .set('Accept', 'application/json')
      .send({ chain, webhookUrl, auth: true, jwt });
    return res.body;
  },

  updateRole: async (args: AssignRoleArgs) => {
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
  },

  createSubscription: async (args: SubscriptionArgs) => {
    const res = await chai
      .request(app)
      .post('/api/createSubscription')
      .set('Accept', 'application/json')
      .send({ ...args });
    const subscription = res.body.result;
    return subscription;
  },

  createCommunity: async (args: CommunityArgs) => {
    const res = await chai
      .request(app)
      .post('/api/createCommunity')
      .set('Accept', 'application/json')
      .send({ ...args });
    const community = res.body.result;
    return community;
  },

  joinCommunity: async (args: JoinCommunityArgs) => {
    const { jwt, address, chain, originChain, address_id } = args;
    try {
      await chai.request
        .agent(app)
        .post('/api/linkExistingAddressToCommunity')
        .set('Accept', 'application/json')
        .send({
          address: address.split(':')[2],
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
  },

  setSiteAdmin: async (args: SetSiteAdminArgs) => {
    const { user_id } = args;
    const user = await models.User.findOne({ where: { id: user_id } });
    if (!user) {
      console.error('User not found');
      return false;
    }
    user.isAdmin = true;
    try {
      await user.save();
    } catch (e) {
      console.error('Failed to set user as site admin');
      console.error(e);
      return false;
    }
    return true;
  },
});
