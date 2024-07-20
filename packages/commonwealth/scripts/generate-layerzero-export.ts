import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { promises as fs } from 'fs';
import { QueryTypes } from 'sequelize';

// DB DUMB TIMESTAMP: Saturday, July 20, 2024 9:43:48 AM GMT (epoch: 1721468628)

async function setupDb() {
  await models.sequelize.transaction(async (transaction) => {
    await models.sequelize.query(
      `
          ALTER TABLE "Threads"
              ADD COLUMN IF NOT EXISTS exported BOOLEAN DEFAULT FALSE NOT NULL;
      `,
      { transaction },
    );
    await models.sequelize.query(
      `
          ALTER TABLE "Comments"
              ADD COLUMN IF NOT EXISTS exported BOOLEAN DEFAULT FALSE NOT NULL;
      `,
      { transaction },
    );

    await models.sequelize.query(
      `
        UPDATE "Threads"
        SET exported = false;
      `,
      { transaction },
    );
    await models.sequelize.query(
      `
        UPDATE "Comments"
        SET exported = false;
      `,
      { transaction },
    );
  });
}

type Thread = {
  id: number;
  title: string;
  plaintext: string;
  created_at: string;
  address: string;
};

type Comment = {
  id: number;
  plaintext: string;
  created_at: string;
  address: string;
};

async function getThreadWithComments(): Promise<
  { thread: Thread; comments: Comment[] } | undefined
> {
  const threads = await models.sequelize.query<Thread>(
    `
        SELECT T.id, T.plaintext, T.created_at, T.title, A.address
        FROM "Threads" T
                 JOIN "Addresses" A ON T.address_id = A.id
        WHERE exported = false
          AND T.community_id = 'layerzero' AND T.topic_id = 4741 AND T.deleted_at IS NULL
        LIMIT 1;
    `,
    { type: QueryTypes.SELECT, raw: true },
  );

  let thread: Thread;
  if (threads.length > 0) {
    thread = threads[0];
  } else return;

  const comments = await models.sequelize.query<Comment>(
    `
        SELECT C.id, C.plaintext, C.created_at, A.address
        FROM "Comments" C
                 JOIN "Addresses" A ON C.address_id = A.id
        WHERE exported = false
          AND thread_id = :threadId
          AND C.community_id = 'layerzero'
          AND C.deleted_at is NULL;
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        threadId: thread.id,
      },
    },
  );

  return { thread, comments };
}

async function writeThreadToFile(thread: {
  id: number;
  title: string;
  plaintext: string;
  created_at: string;
  address: string;
}) {
  const markdownContent = `
# ${thread.title}

**Address of the sender:** ${thread.address}

**URL:** https://commonwealth.im/layerzero/discussion/${thread.id}

**Timestamp:** ${thread.created_at}

**Body data:**

${thread.plaintext}
  `;

  const fileName = `LayerZero_SybilReports/${thread.id}.md`;
  await models.sequelize.transaction(async (transaction) => {
    await fs.writeFile(fileName, markdownContent.trim(), 'utf8');
    await models.sequelize.query(
      `
          UPDATE "Threads"
          SET exported = true
          WHERE id = :commentId;
      `,
      {
        type: QueryTypes.UPDATE,
        raw: true,
        replacements: {
          commentId: thread.id,
        },
      },
    );
  });
  console.log(`File ${thread.id}.md created successfully.`);
}

async function writeCommentsToFiles({
  thread,
  comments,
}: {
  thread: Thread;
  comments: Comment[];
}): Promise<void> {
  for (const comment of comments) {
    const markdownContent = `
**Address of the sender:** ${comment.address}

**URL:** https://commonwealth.im/layerzero/discussion/${thread.id}?comment=${comment.id}

**Timestamp:** ${comment.created_at}

**Body data:**

${comment.plaintext}
    `;
    const fileName = `LayerZero_SybilReports/${thread.id}_comment_${comment.id}.md`;
    await models.sequelize.transaction(async (transaction) => {
      await fs.writeFile(fileName, markdownContent.trim(), 'utf8');
      await models.sequelize.query(
        `
            UPDATE "Comments"
            SET exported = true
            WHERE id = :commentId;
        `,
        {
          type: QueryTypes.UPDATE,
          raw: true,
          replacements: {
            commentId: comment.id,
          },
        },
      );
    });
    console.log(`File ${fileName} created successfully.`);
  }
}

async function iterateThreads(maxIter?: number) {
  let index = 0;
  while (maxIter ? index < maxIter : true) {
    const res = await getThreadWithComments();
    if (!res) break;
    await writeThreadToFile(res!.thread);
    await writeCommentsToFiles(res!);
    index++;
  }
}

async function main() {
  await setupDb();
  await iterateThreads();
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to delete user', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
