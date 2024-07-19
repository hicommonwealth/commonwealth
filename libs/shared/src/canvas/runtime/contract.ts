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
      thread_id: 'number', // TODO: this should be @threads or the cid of the thread
      body: 'string',
      parent_comment_id: 'string?', // TODO: this should be @comments or the cid of the comment
      updated_at: 'integer',
      $indexes: [['thread_id', 'author']],
    },
    thread_reactions: {
      id: 'primary',
      thread_id: 'number', // TODO: this should be @threads or the cid of the thread
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
    thread(db, { community, title, body, link, topic }, { did, id, timestamp }) {
      db.set("threads", {
        id: id,
        author: did,
        community,
        title,
        body,
        link,
        // topic,
        updated_at: timestamp,
      });
    },
    // TODO: not implemented (packages/commonwealth/server/routes/threads/update_thread_handler.ts)
    async updateThread(db, { thread_id, title, body }, { did, id }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.set('threads', { id: t.id, title, body });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/threads/delete_thread_handler.ts)
    async deleteThread(db, { thread_id }, { did, id }) {
      const t = await db.get("threads", thread_id);
      if (!t || !t.id) throw new Error("invalid thread");
      db.delete("threads", t.id.toString());
    },
    comment(db, { thread_id, body, parent_comment_id }, { did, id, timestamp }) {
      db.set("comments", {
        id: id,
        author: did,
        thread_id, // TODO: this should be the thread's canvas_hash/cid
        body,
        parent_comment_id,
        updated_at: timestamp
      });
    },
    // TODO: not implemented (packages/commonwealth/server/routes/comments/update_comment_handler.ts)
    async updateComment(db, { comment_id, body }, { did, id }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.set("comments", { id: c.id.toString(), body });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/comments/delete_comment_handler.ts)
    async deleteComment(db, { comment_id }, { did, id }) {
      const c = await db.get("comments", comment_id);
      if (!c || !c.id) throw new Error("invalid comment");
      db.delete("comments", c.id.toString());
    },
    reactThread(db, { thread_id, value }, { did, id }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("thread_reactions", {
        id: `${thread_id}/${did}`,
        author: did,
        thread_id,
        value,
      });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/threads/delete_thread_reaction_handler.ts)
    unreactThread(db, { thread_id, value }, { did, id }) {
      db.set("thread_reactions", {
        id: `${thread_id}/${did}`,
        author: did,
        thread_id,
        value: null,
      });
    },
    reactComment(db, { comment_id, value }, { did, id }) {
      if (value !== 'like' && value !== 'dislike') {
        throw new Error('Invalid reaction');
      }
      db.set("comment_reactions", {
        id: `${comment_id}/${did}`,
        author: did,
        comment_id,
        value,
      });
    },
    // TODO: signed on client, not verified on server (packages/commonwealth/server/routes/comments/delete_comment_reaction_handler.ts)
    unreactComment(db, { comment_id, value }, { did, id }) {
      db.set("comment_reactions", {
        id: `${comment_id}/${did}`,
        author: did,
        comment_id,
        value: null,
      });
    },
  },
} satisfies Contract;
