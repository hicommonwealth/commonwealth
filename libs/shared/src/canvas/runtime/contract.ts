import { Contract } from "@canvas-js/core";

export const topic = 'common.xyz';

export const contract = {
  models: {
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
  },
  actions: {
    async thread(db, { community, title, body, link, topic }, { did, id, timestamp }) {
      db.set("threads", {
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
    async updateThread(db, { thread_id, title, body, link, topic }, { did, id, timestamp }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.set('threads', { id: t.id as string, author: t.author, community: t.community, title, body, link, topic, updated_at: timestamp });
    },
    async deleteThread(db, { thread_id }, { did, id }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.delete("threads", t.id as string);
    },
    async comment(db, { thread_id, body, parent_comment_id }, { did, id, timestamp }) {
      db.set("comments", {
        id: id,
        author: did,
        thread_id,
        body,
        parent_comment_id,
        updated_at: timestamp
      });
    },
    // TODO: not implemented (packages/commonwealth/server/routes/comments/update_comment_handler.ts)
    async updateComment(db, { comment_id, body }, { did, id, timestamp }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.set("comments", { id: c.id, author: c.author, thread_id: c.thread_id, body, parent_comment_id: c.parent_comment_id, updated_at: timestamp });
    },
    async deleteComment(db, { comment_id }, { did, id }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.delete("comments", c.id);
    },
    async reactThread(db, { thread_id, value }, { did, id, timestamp }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("thread_reactions", {
        id: `${thread_id}/${did}`,
        author: did,
        thread_id,
        value,
        updated_at: timestamp,
      });
    },
    async unreactThread(db, { thread_id, value }, { did, id, timestamp }) {
      db.set("thread_reactions", {
        id: `${thread_id}/${did}`,
        author: did,
        thread_id,
        value: null,
        updated_at: timestamp
      });
    },
    async reactComment(db, { comment_id, value }, { did, id, timestamp }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("comment_reactions", {
        id: `${comment_id}/${did}`,
        author: did,
        comment_id,
        value,
        updated_at: timestamp,
      });
    },
    async unreactComment(db, { comment_id, value }, { did, id, timestamp }) {
      db.set("comment_reactions", {
        id: `${comment_id}/${did}`,
        author: did,
        comment_id,
        value: null,
        updated_at: timestamp,
      });
    },
  },
} satisfies Contract;
