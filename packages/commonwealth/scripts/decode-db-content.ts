import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { deltaToMarkdown } from 'quill-delta-to-markdown';
import { Op, QueryTypes } from 'sequelize';

const log = logger(import.meta);
const BATCH_SIZE = 10;
const queryCase = 'WHEN id = ? THEN ? ';

function decodeContent(content: string) {
  // decode if URI encoded
  let decodedContent: string;
  try {
    decodedContent = decodeURIComponent(content);
  } catch {
    decodedContent = content;
  }

  // convert to Markdown if Quill Delta format
  let rawMarkdown: string;
  try {
    const delta = JSON.parse(decodedContent);
    if ('ops' in delta) {
      rawMarkdown = deltaToMarkdown(delta.ops);
    } else {
      rawMarkdown = delta;
    }
  } catch (e) {
    rawMarkdown = decodedContent;
  }

  return rawMarkdown.trim();
}

async function decodeThreads(lastId: number = 0) {
  let lastThreadId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const threads = await models.Thread.findAll({
        attributes: ['id', 'title', 'body'],
        where: {
          id: {
            [Op.gt]: lastThreadId,
          },
        },
        order: [['id', 'ASC']],
        limit: BATCH_SIZE,
        lock: transaction.LOCK.UPDATE,
        transaction,
        paranoid: false,
      });
      if (threads.length === 0) {
        await transaction.rollback();
        break;
      }

      lastThreadId = threads.at(-1)!.id!;

      let queryTitleCases = '';
      let queryBodyCases = '';
      const titleReplacements: (number | string)[] = [];
      const bodyReplacements: (number | string)[] = [];
      const threadIds: number[] = [];
      for (const { id, title, body } of threads) {
        const decodedTitle = decodeContent(title);
        queryTitleCases += queryCase;
        titleReplacements.push(id!, decodedTitle);

        const decodedBody = body ? decodeContent(body) : '';
        queryBodyCases += queryCase;
        bodyReplacements.push(id!, decodedBody);

        threadIds.push(id!);
      }

      if (threadIds.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "Threads"
              SET title = CASE
                  ${queryTitleCases}
                  END,
                  body  = CASE
                      ${queryBodyCases}
                      END
              WHERE id IN (?);
          `,
          {
            replacements: [
              ...titleReplacements,
              ...bodyReplacements,
              threadIds,
            ],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully decoded threads' +
          ` ${threads[0].id} to ${threads.at(-1)!.id}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function decodeThreadVersionHistory(lastId: number = 0) {
  let lastVersionHistoryId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const threads = await models.ThreadVersionHistory.findAll({
        attributes: ['id', 'body'],
        where: {
          id: {
            [Op.gt]: lastVersionHistoryId,
          },
        },
        order: [['id', 'ASC']],
        limit: BATCH_SIZE,
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (threads.length === 0) {
        await transaction.rollback();
        break;
      }

      lastVersionHistoryId = threads.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const threadVersionIds: number[] = [];
      for (const { id, body } of threads) {
        const decodedBody = decodeContent(body);
        if (body === decodedBody) continue;
        queryCases += queryCase;
        replacements.push(id!, decodedBody);
        threadVersionIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "ThreadVersionHistories"
              SET body = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, threadVersionIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully decoded thread version histories ' +
          `${threads[0].id} to ${threads.at(-1)!.id}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function decodeCommentVersionHistory(lastId: number = 0) {
  let lastCommentVersionId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const comments = await models.CommentVersionHistory.findAll({
        attributes: ['id', 'text'],
        where: {
          id: {
            [Op.gt]: lastCommentVersionId,
          },
        },
        order: [['id', 'ASC']],
        limit: BATCH_SIZE,
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (comments.length === 0) {
        await transaction.rollback();
        break;
      }

      lastCommentVersionId = comments.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const commentVersionIds: number[] = [];
      for (const { id, text } of comments) {
        const decodedBody = decodeContent(text);
        if (text === decodedBody) continue;
        queryCases += queryCase;
        replacements.push(id!, decodedBody);
        commentVersionIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "CommentVersionHistories"
              SET text = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, commentVersionIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully decoded comment version histories' +
          ` ${comments[0].id} to ${comments.at(-1)!.id}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function decodeComments(lastId: number = 0) {
  let lastCommentId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const comments = await models.Comment.findAll({
        attributes: ['id', 'text'],
        where: {
          id: {
            [Op.gt]: lastCommentId,
          },
        },
        order: [['id', 'ASC']],
        limit: BATCH_SIZE,
        lock: transaction.LOCK.UPDATE,
        transaction,
        paranoid: false,
      });

      if (comments.length === 0) {
        await transaction.rollback();
        break;
      }

      lastCommentId = comments.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const commentIds: number[] = [];
      for (const { id, text } of comments) {
        const decodedBody = decodeContent(text);
        if (text === decodedBody) continue;
        queryCases += queryCase;
        replacements.push(id!, decodedBody);
        commentIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "Comments"
              SET text = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, commentIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully decoded comments' +
          ` ${comments[0].id} to ${comments.at(-1)!.id}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function main() {
  const acceptedArgs = [
    'threads',
    'thread-versions',
    'comments',
    'comment-versions',
  ];
  if (!acceptedArgs.includes(process.argv[2])) {
    log.error(`Must provide one of: ${JSON.stringify(acceptedArgs)}`);
  }

  let lastId = 0;
  if (process.argv[3]) {
    lastId = parseInt(process.argv[3]);
  }

  switch (process.argv[2]) {
    case 'threads':
      await decodeThreads(lastId);
      log.info('Thread decoding finished.');
      break;
    case 'thread-versions':
      await decodeThreadVersionHistory(lastId);
      log.info('Thread version history decoding finished.');
      break;
    case 'comments':
      await decodeComments(lastId);
      log.info('Comment decoding finished.');
      break;
    case 'comment-versions':
      await decodeCommentVersionHistory(lastId);
      log.info('Comment version history decoding finished');
      break;
    default:
      log.error('Invalid argument!');
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
