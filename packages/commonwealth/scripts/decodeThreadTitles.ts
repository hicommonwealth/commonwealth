import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Op, QueryTypes } from 'sequelize';

const THREAD_BATCH_SIZE = 1_000;

async function main() {
  let lastThreadId = 0;
  while (true) {
    const threads = await models.Thread.findAll({
      attributes: ['id', 'title'],
      where: {
        id: {
          [Op.gt]: lastThreadId,
        },
      },
      order: [['id', 'DESC']],
      limit: THREAD_BATCH_SIZE,
    });
    if (threads.length === 0) break;

    lastThreadId = threads.at(-1)!.id!;

    let queryCases = '';
    const replacements: (number | string)[] = [];
    const threadIds: number[] = [];
    for (const { id, body } of threads) {
      try {
        const decodedBody = decodeURIComponent(body || '');
        if (body === decodedBody) continue;

        if (replacements.length > 0) queryCases += ',\n';
        queryCases += 'WHEN id = ? THEN ?';
        replacements.push(id!, decodedBody);
        threadIds.push(id!);
      } catch {}
    }

    if (replacements.length > 0) {
      await models.sequelize.query(
        `
          UPDATE "Threads"
          SET body = CASE
                          ${queryCases}
                      END
          WHERE id IN (?);
      `,
        {
          replacements: [...replacements, threadIds],
          type: QueryTypes.BULKUPDATE,
        },
      );
    }
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
