import { Contract } from "@canvas-js/core";

export const topic = 'v1.common.xyz';

export const contract = {
  models: {
    threads: {
      id: 'primary',
      community: 'string',
      author: 'string',
      title: 'string',
      body: 'string',
      link: 'string',
      updated_at: 'integer',
      $indexes: [['author']],
    },
    comments: {
      id: 'primary',
      author: 'string',
      thread_id: '@threads',
      body: 'string',
      parent_comment_id: '@comments',
      updated_at: 'integer',
      $indexes: [['thread_id', 'author']],
    },
    thread_reactions: {
      id: 'primary',
      thread_id: '@threads',
      author: 'string',
      value: 'integer',
      updated_at: 'integer',
      $indexes: [['thread_id', 'author']],
    },
    comment_reactions: {
      id: 'primary',
      comment_id: '@comments',
      author: 'string',
      value: 'integer',
      updated_at: 'integer',
      $indexes: [['comment_id', 'author']],
    },
  },
  actions: {
    thread(db, { community, title, body, link, topic }, { address, id }) {
      db.set("threads", {
        id: id,
        author: address,
        community,
        title,
        body,
        link,
        topic,
      });
    },
    // TODO: not implemented (packages/commonwealth/server/routes/threads/update_thread_handler.ts)
    async updateThread(db, { thread_id, title, body }, { address, id }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.set('threads', { id: t.id, title, body });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/threads/delete_thread_handler.ts)
    async deleteThread(db, { thread_id }, { address, id }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.delete("threads", t.id.toString());
    },
    comment(db, { thread_id, body, parent_comment_id }, { address, id }) {
      db.set("comments", {
        id: id,
        author: address,
        thread_id,
        body,
        parent_comment_id,
      });
    },
    // TODO: not implemented (packages/commonwealth/server/routes/comments/update_comment_handler.ts)
    async updateComment(db, { comment_id, body }, { address, id }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.set("comments", { id: c.id.toString(), body });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/comments/delete_comment_handler.ts)
    async deleteComment(db, { comment_id }, { address, id }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.delete("comments", c.id.toString());
    },
    reactThread(db, { thread_id, value }, { address, id }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("thread_reactions", {
        id: `${thread_id}/${address}`,
        author: address,
        thread_id,
        value,
      });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/threads/delete_thread_reaction_handler.ts)
    unreactThread(db, { thread_id, value }, { address, id }) {
      db.set("thread_reactions", {
        id: `${thread_id}/${address}`,
        author: address,
        thread_id,
        value: null,
      });
    },
    reactComment(db, { comment_id, value }, { address, id }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("comment_reactions", {
        id: `${comment_id}/${address}`,
        author: address,
        comment_id,
        value,
      });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/comments/delete_comment_reaction_handler.ts)
    unreactComment(db, { comment_id, value }, { address, id }) {
      db.set("comment_reactions", {
        id: `${comment_id}/${address}`,
        author: address,
        comment_id,
        value: null,
      });
    },
  },
} satisfies Contract;
