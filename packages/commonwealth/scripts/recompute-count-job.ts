import { models } from '@hicommonwealth/model';

export async function recomputeCounts() {
  return models.sequelize.transaction(async (t) => {
    console.log('Add comment reaction count');
    console.time('Add comment reaction count');
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
      { raw: true, transaction: t, logging: console.log },
    );
    console.timeEnd('Add comment reaction count');

    // TODO: add comments reaction
    console.log('Add thread reaction count');
    console.time('Add thread reaction count');
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
      { raw: true, transaction: t, logging: console.log },
    );
    console.timeEnd('Add thread reaction count');

    console.log('Add thread comment count');
    console.time('Add thread comment count');
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
      { raw: true, transaction: t, logging: console.log },
    );
    console.timeEnd('Add thread comment count');

    console.log('Add thread max notification id');
    console.time('Add thread max notification id');
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
      { raw: true, transaction: t, logging: console.log },
    );
    console.timeEnd('Add thread max notification id');
  });
}

if (!module.parent) {
  console.log('recompute job started');
  recomputeCounts()
    .then(() => {
      console.log('recompute job completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.log('recompute job exit with error');
      console.log(err);
      process.exit(1);
    });
}
