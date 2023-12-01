export const chains = [
  'eip155:*',
  'cosmos:*',
  'solana:*',
  'polkadot:*',
  'near:*',
];

export const models = {
  threads: {
    id: 'string',
    community: 'string',
    creator: 'string',
    title: 'string',
    body: 'string',
    link: 'string',
    updated_at: 'datetime',
    indexes: ['creator'],
  },
  comments: {
    id: 'string',
    creator: 'string',
    thread_id: 'string',
    body: 'string',
    parent_comment_id: 'string',
    updated_at: 'datetime',
    indexes: ['thread_id', 'creator'],
  },
  thread_reactions: {
    id: 'string',
    thread_id: 'string',
    creator: 'string',
    value: 'integer',
    updated_at: 'datetime',
    indexes: ['thread_id', 'creator'],
  },
  comment_reactions: {
    id: 'string',
    comment_id: 'string',
    creator: 'string',
    value: 'integer',
    updated_at: 'datetime',
    indexes: ['comment_id', 'creator'],
  },
};

export const actions = {
  thread({ community, title, body, link, topic }, { db, from, hash }) {
    db.threads.set(hash, {
      id: hash,
      creator: from,
      community,
      title,
      body,
      link,
      topic,
    });
  },
  updateThread({ thread_id, title, body }, { db, from, hash }) {
    const t = db.threads.find({ id: thread_id, creator: from });
    db.threads.set(hash, { id: t.id, title, body });
  },
  deleteThread({ thread_id }, { db, from, hash }) {
    const c = db.threads.find({ id: thread_id, creator: from });
    db.threads.delete({ id: c.id });
  },
  comment({ thread_id, body, parent_comment_id }, { db, from, hash }) {
    db.comments.set(hash, {
      id: hash,
      creator: from,
      thread_id,
      body,
      parent_comment_id,
    });
  },
  updateComment({ comment_id, body }, { db, from, hash }) {
    const c = db.comments.find({ id: comment_id, creator: from });
    db.comments.set(hash, { id: c.id, body });
  },
  deleteComment({ comment_id }, { db, from, hash }) {
    const c = db.comments.find({ id: comment_id, creator: from });
    db.comments.delete({ id: c.id });
  },
  reactThread({ thread_id, value }, { db, from, hash }) {
    if (value !== 'like' && value !== 'dislike') {
      throw new Error('Invalid reaction');
    }
    db.thread_reactions.set(hash, {
      id: `${thread_id}/${from}`,
      creator: from,
      thread_id,
      value,
    });
  },
  unreactThread({ thread_id, value }, { db, from, hash }) {
    db.thread_reactions.set(hash, {
      id: `${thread_id}/${from}`,
      creator: from,
      thread_id,
      value: null,
    });
  },
  reactComment({ comment_id, value }, { db, from, hash }) {
    if (value !== 'like' && value !== 'dislike') {
      throw new Error('Invalid reaction');
    }
    db.comment_reactions.set(hash, {
      id: `${comment_id}/${from}`,
      creator: from,
      comment_id,
      value,
    });
  },
  unreactComment({ comment_id, value }, { db, from, hash }) {
    db.comment_reactions.set(hash, {
      id: `${comment_id}/${from}`,
      creator: from,
      comment_id,
      value: null,
    });
  },
};

export const sources = {
  '/commonwealth': { ...actions },
};

export const routes = {};
