/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import { SignedMessage } from '@canvas-js/gossiplog';
import type {
  Awaitable,
  Message,
  SessionSigner,
  Signature,
} from '@canvas-js/interfaces';
import { Action, Session } from '@canvas-js/interfaces';
import type {
  CommunityAttributes,
  DB,
  ThreadAttributes,
} from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  CANVAS_TOPIC,
  CanvasSignResult,
  CanvasSignedData,
  SubstrateSignerCW,
  serializeCanvas,
  toCanvasSignedDataApiArgs,
  type Link,
  type LinkSource,
  type Role,
} from '@hicommonwealth/shared';
import chai from 'chai';
import type { Application } from 'express';
import { z } from 'zod';
import { TEST_BLOCK_INFO_STRING } from '../../shared/adapters/chain/ethereum/keys';

function createCanvasSignResult({ session, sign, action }): CanvasSignResult {
  const sessionMessage = {
    clock: 1,
    parents: [],
    payload: session,
    topic: CANVAS_TOPIC,
  };
  const sessionMessageSignature = sign(sessionMessage);

  const sessionMessageId = SignedMessage.encode(
    sessionMessageSignature,
    sessionMessage,
  ).id;

  const actionMessage = {
    clock: 2,
    parents: [sessionMessageId],
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
  const actionMessageId = SignedMessage.encode(
    actionMessageSignature,
    actionMessage,
  ).id;

  return {
    canvasSignedData,
    canvasMsgId: actionMessageId,
  };
}

export interface ThreadArgs {
  jwt: any;
  address: string;
  did: `did:${string}`;
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
  did: `did:${string}`;
  jwt: any;
  text: any;
  parentCommentId?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  threadId?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  threadMsgId?: any;
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
  did: `did:${string}`;
  reaction: string;
  jwt: string;
  comment_id?: number;
  thread_id?: number;
  comment_msg_id: string;
  session: Session;
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

export interface CreateThreadReactionArgs {
  author_chain: string;
  chain: string;
  address: string;
  did: `did:${string}`;
  reaction: string;
  jwt: string;
  thread_id?: number;
  thread_msg_id: string;
  session: Session;
  sign: (message: Message<Action | Session>) => Awaitable<Signature>;
}

export interface EditTopicArgs {
  jwt: any;
  address: string;
  did: `did:${string}`;
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
    did: `did:${string}`;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSubscription: (args: SubscriptionArgs) => Promise<any>;
  createCommunity: (
    args: z.infer<(typeof schemas.CreateCommunity)['input']>,
    jwt: string,
  ) => Promise<CommunityAttributes>;
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

    const { payload: session, signer } =
      await sessionSigner.newSession(CANVAS_TOPIC);
    const walletAddress = session.did.split(':')[4];

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
        // @ts-expect-error <StrictNullChecks>
        chain_id,
        wallet_id,
        session: serializeCanvas(session),
      });
    const user_id = res.body.result.user.id;
    const email = res.body.result.user.email;
    return {
      address_id,
      address: session.did.split(':')[4],
      did: session.did,
      user_id,
      email,
      session,
      sign: signer.sign.bind(signer),
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
      jwt,
      chainId,
      address,
      did,
      title,
      body,
      topicId,
      readOnly,
      kind,
      url,
      session,
      sign,
    } = args;

    const action: Action = {
      type: 'action' as const,
      did,
      name: 'thread',
      args: {
        community: chainId || '',
        title: encodeURIComponent(title),
        // @ts-expect-error StrictNullChecks
        body: encodeURIComponent(body),
        link: url || '',
        topic: topicId || '',
      },
      context: {
        timestamp: Date.now(),
      },
    };

    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post('/api/v1/CreateThread')
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        jwt,
        community_id: chainId,
        topic_id: topicId,
        title: encodeURIComponent(title),
        // @ts-expect-error StrictNullChecks
        body: encodeURIComponent(body),
        kind,
        stage: '',
        url,
        read_only: readOnly || false,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    if (res.ok) return { result: res.body, status: 'Success' };
    return { status: res.status.toString() };
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
      did,
      jwt,
      text,
      parentCommentId,
      threadId,
      threadMsgId,
      session,
      sign,
    } = args;

    const action: Action = {
      type: 'action' as const,
      did,
      name: 'comment',
      args: {
        body: text,
        thread_id: threadMsgId,
        parent_comment_id: parentCommentId || null,
      },
      context: {
        timestamp: Date.now(),
      },
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post(`/api/v1/CreateComment`)
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        author_chain: chain,
        chain,
        address,
        parent_id: parentCommentId || null,
        thread_id: threadId,
        thread_msg_id: threadMsgId,
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
      .patch(`/api/v1/UpdateComment`)
      .set('Accept', 'application/json')
      .set('address', address!.split(':')[2])
      .send({
        author_chain: chain,
        address,
        body: encodeURIComponent(text),
        jwt,
        chain: community ? undefined : chain,
        comment_id,
        community,
      });
    return res.body;
  },

  createReaction: async (args: CreateReactionArgs) => {
    const {
      chain,
      address,
      did,
      jwt,
      author_chain,
      reaction,
      comment_id,
      comment_msg_id: commentMsgId,
      session,
      sign,
    } = args;

    const action: Action = {
      type: 'action' as const,
      did,
      name: 'reactComment',
      args: { comment_id: commentMsgId, value: reaction },
      context: {
        timestamp: Date.now(),
      },
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post(`/api/v1/CreateCommentReaction`)
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        chain,
        address,
        reaction,
        comment_id,
        author_chain,
        jwt,
        comment_msg_id: commentMsgId,
        ...toCanvasSignedDataApiArgs(canvasSignResult),
      });
    return res.body;
  },

  createThreadReaction: async (args: CreateThreadReactionArgs) => {
    const {
      chain,
      address,
      did,
      jwt,
      author_chain,
      reaction,
      thread_id,
      thread_msg_id: threadMsgId,
      session,
      sign,
    } = args;

    const action: Action = {
      type: 'action' as const,
      did,
      name: 'reactThread',
      args: { thread_id: threadMsgId, value: reaction },
      context: {
        timestamp: Date.now(),
      },
    };
    const canvasSignResult = createCanvasSignResult({
      session,
      sign,
      action,
    });

    const res = await chai.request
      .agent(app)
      .post(`/api/v1/CreateThreadReaction`)
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        chain,
        address,
        reaction,
        author_chain,
        jwt,
        thread_id,
        thread_msg_id: threadMsgId,
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
    await models.sequelize.query(
      `
          UPDATE "Addresses"
          SET role = '${args.role}'
          WHERE id = ${args.address_id};
      `,
    );
    return true;
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

  createCommunity: async (args, jwt: string) => {
    const res = await chai
      .request(app)
      .post(`/api/v1/CreateCommunity`)
      .set('Accept', 'application/json')
      .set('address', args.user_address)
      .send({
        jwt,
        ...args,
      });
    return res.body.community;
  },

  joinCommunity: async (args: JoinCommunityArgs) => {
    const { jwt, address, chain } = args;
    try {
      await chai.request
        .agent(app)
        .post('/api/v1/JoinComunity')
        .set('Accept', 'application/json')
        .set('address', address)
        .send({
          community_id: chain,
          jwt,
        });
    } catch (e) {
      console.error('Failed to link an existing address to a chain');
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
