
BEGIN;
    SELECT 'recompute' as start, Now();
    
    ;with reactionCntByComment AS (
        SELECT SUM(CASE WHEN reaction='like' THEN 1 ELSE -1 END) as cnt, comment_id
        FROM "Reactions"
        GROUP BY comment_id
      )

      Update "Comments"
      SET reaction_count=rc.cnt
      FROM reactionCntByComment rc
      where rc.comment_id="Comments".id;

    ;with reactionCntByThread AS (
        SELECT SUM(CASE WHEN reaction='like' THEN 1 ELSE -1 END) as cnt, r.thread_id
        FROM "Reactions" r
        GROUP BY thread_id
      )

      Update "Threads"
      SET reaction_count=rc.cnt
      FROM reactionCntByThread rc
      where rc.thread_id="Threads".id;

    ;with commentCntByThread AS (
        SELECT count(id) as cnt,thread_id
        FROM "Comments"
        WHERE deleted_at IS NULL
        GROUP BY thread_id
      )

      Update "Threads"
      SET comment_count=cc.cnt
      FROM commentCntByThread cc
      where cc.thread_id="Threads".id;


    ;with maxNotificationIdByThread AS (
        SELECT max(id) as max_id,thread_id
        FROM "Notifications" n
        where n.category_id IN ('new-thread-creation', 'new-comment-creation')
        GROUP BY thread_id
      )

      Update "Threads"
      SET max_notif_id=mn.max_id
      FROM maxNotificationIdByThread mn
      where mn.thread_id="Threads".id;

      SELECT 'recompute' as finish, Now();
END;