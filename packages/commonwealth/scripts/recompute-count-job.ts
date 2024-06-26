import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function recomputeCounts(
  logging: boolean | ((sql: string, timing?: number) => void) = false,
) {
  return models.sequelize.transaction(async (t) => {
    /*
     *  Comments.reaction_count
     */
    logging && console.log('Add comment reaction count');
    logging && console.time('Add comment reaction count');
    await models.sequelize.query(
      ` -- SELECT DISTINCT reaction FROM "Reactions"
      ;with reactionCntByComment AS (
        SELECT SUM(CASE WHEN reaction='like' THEN 1 ELSE -1 END) as cnt, comment_id
        FROM "Reactions"
        GROUP BY comment_id
      )

      Update "Comments"
      SET reaction_count=rc.cnt
      FROM reactionCntByComment rc
      where rc.comment_id="Comments".id
      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add comment reaction count');

    /*
     *  Threads.reaction_count
     */
    logging && console.log('Add thread reaction count');
    logging && console.time('Add thread reaction count');
    await models.sequelize.query(
      `
      ;with reactionCntByThread AS (
        SELECT SUM(CASE WHEN reaction='like' THEN 1 ELSE -1 END) as cnt, r.thread_id
        FROM "Reactions" r
        GROUP BY thread_id
      )

      Update "Threads"
      SET reaction_count=rc.cnt
      FROM reactionCntByThread rc
      where rc.thread_id="Threads".id
      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add thread reaction count');

    /*
     *  Threads.comment_count
     */
    logging && console.log('Add thread comment count');
    logging && console.time('Add thread comment count');
    await models.sequelize.query(
      `
      ;with commentCntByThread AS (
        SELECT count(id) as cnt,thread_id
        FROM "Comments"
        WHERE deleted_at IS NULL
        GROUP BY thread_id
      )

      Update "Threads"
      SET comment_count=cc.cnt
      FROM commentCntByThread cc
      where cc.thread_id="Threads".id
      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add thread comment count');

    /*
     *  Community.thread_count
     */
    logging && console.log('Add community thread count');
    logging && console.time('Add community thread count');
    await models.sequelize.query(
      `
      ;with threadCntByCommunity AS (
        SELECT
          count(id) as cnt,
          community_id
        FROM "Threads"
        WHERE deleted_at IS NULL
        GROUP BY community_id
      )

      Update "Communities"
      SET thread_count=cc.cnt
      FROM threadCntByCommunity cc
      where cc.community_id="Communities".id
      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add community thread count');

    /*
     *  Community.address_count
     */
    logging && console.log('Add community address count');
    logging && console.time('Add community address count');
    await models.sequelize.query(
      `
      ;with addressCntByCommunity AS (
        SELECT
          count(id) as cnt,
          community_id
        FROM "Addresses"
        WHERE verified IS NOT NULL
        GROUP BY community_id
      )

      Update "Communities"
      SET address_count=cc.cnt
      FROM addressCntByCommunity cc
      where cc.community_id="Communities".id
      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add community address count');

    /*
     *  Thread.max_notif_id
     */
    logging && console.log('Add thread max notification id');
    logging && console.time('Add thread max notification id');
    await models.sequelize.query(
      `
      ;with maxNotificationIdByThread AS (
        SELECT max(id) as max_id,thread_id
        FROM "Notifications" n
        where n.category_id IN ('new-thread-creation', 'new-comment-creation')
        GROUP BY thread_id
      )

      Update "Threads"
      SET max_notif_id=mn.max_id
      FROM maxNotificationIdByThread mn
      where mn.thread_id="Threads".id

      `,
      { raw: true, transaction: t, logging },
    );
    logging && console.timeEnd('Add thread max notification id');
  });
}

if (import.meta.url.endsWith(process.argv[1])) {
  log.info('recompute job started');
  recomputeCounts(console.log)
    .then(() => {
      log.info('Recompute job completed successfully');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      log.error('Recompute job exit with error', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
