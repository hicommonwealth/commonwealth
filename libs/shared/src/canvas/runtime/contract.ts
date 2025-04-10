import type { Actions, ModelSchema } from '@canvas-js/core';

export const contractTopic = 'common.xyz';

const models = {
  threads: {
    id: 'primary',
    community: 'string',
    author: 'string',
    title: 'string',
    body: 'string',
    link: 'string',
    topic: 'number',
    updated_at: 'integer',
    $indexes: [['author']],
  },
  comments: {
    id: 'primary',
    author: 'string',
    thread_id: '@threads.id?',
    body: 'string',
    parent_comment_id: '@comments.id?',
    updated_at: 'integer',
    $indexes: [['thread_id', 'author']],
  },
  thread_reactions: {
    id: 'primary',
    thread_id: '@threads.id?',
    author: 'string',
    value: 'string?',
    updated_at: 'integer',
    $indexes: [['thread_id', 'author']],
  },
  comment_reactions: {
    id: 'primary',
    comment_id: '@comments.id?',
    author: 'string',
    value: 'string?',
    updated_at: 'integer',
    $indexes: [['comment_id', 'author']],
  },
} satisfies ModelSchema;

const actions = {
  async thread(db, { community, title, body, link, topic }) {
    const { did, id, timestamp } = this;
    await db.set('threads', {
      id: id,
      author: did,
      community,
      title,
      body,
      link,
      topic,
      updated_at: timestamp,
    });
  },
  // TODO: not implemented (packages/commonwealth/server/routes/threads/update_thread_handler.ts)
  async updateThread(db, { thread_id, title, body, link, topic }) {
    const { did, timestamp } = this;
    const t = await db.get('threads', thread_id);
    if (!t || !t.id) throw new Error('invalid thread');
    if (t.author !== did) throw new Error('invalid thread');
    await db.set('threads', {
      id: t.id as string,
      author: t.author,
      community: t.community,
      title,
      body,
      link,
      topic,
      updated_at: timestamp,
    });
  },
  async deleteThread(db, { thread_id }) {
    const { did } = this;
    const t = await db.get('threads', thread_id);
    if (!t || !t.id) throw new Error('invalid thread');
    if (t.author !== did) throw new Error('invalid thread');
    await db.delete('threads', t.id as string);
  },
  async comment(db, { thread_id, body, parent_comment_id }) {
    const { did, id, timestamp } = this;
    await db.set('comments', {
      id: id,
      author: did,
      thread_id,
      body,
      parent_comment_id,
      updated_at: timestamp,
    });
  },
  // TODO: not implemented (packages/commonwealth/server/routes/comments/update_comment_handler.ts)
  async updateComment(db, { comment_id, body }) {
    const { did, timestamp } = this;
    const c = await db.get('comments', comment_id);
    if (!c || !c.id) throw new Error('invalid comment');
    if (c.author !== did) throw new Error('invalid comment');
    await db.set('comments', {
      id: c.id,
      author: c.author,
      thread_id: c.thread_id,
      body,
      parent_comment_id: c.parent_comment_id,
      updated_at: timestamp,
    });
  },
  async deleteComment(db, { comment_id }) {
    const { did } = this;
    const c = await db.get('comments', comment_id);
    if (!c || !c.id) throw new Error('invalid comment');
    if (c.author !== did) throw new Error('invalid comment');
    await db.delete('comments', c.id as string);
  },
  async reactThread(db, { thread_id, value }) {
    const { did, timestamp } = this;
    if (value !== 'like' && value !== 'dislike') {
      throw new Error('Invalid reaction');
    }
    await db.set('thread_reactions', {
      id: `${thread_id}/${did}`,
      author: did,
      thread_id,
      value,
      updated_at: timestamp,
    });
  },
  async unreactThread(db, { thread_id }) {
    const { did } = this;
    const r = await db.get('thread_reactions', `${thread_id}/${did}`);
    if (!r || !r.id) throw new Error('reaction does not exist');
    await db.delete('thread_reactions', `${thread_id}/${did}`);
  },
  async reactComment(db, { comment_id, value }) {
    const { did, timestamp } = this;
    if (value !== 'like' && value !== 'dislike') {
      throw new Error('Invalid reaction');
    }
    await db.set('comment_reactions', {
      id: `${comment_id}/${did}`,
      author: did,
      comment_id,
      value,
      updated_at: timestamp,
    });
  },
  async unreactComment(db, { comment_id }) {
    const { did } = this;
    const r = await db.get('comment_reactions', `${comment_id}/${did}`);
    if (!r || !r.id) throw new Error('reaction does not exist');
    await db.delete('comment_reactions', `${comment_id}/${did}`);
  },
} satisfies Actions<typeof models>;

export const contract = { models, actions };
