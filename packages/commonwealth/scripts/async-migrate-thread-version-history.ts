//TODO: This should be deleted after thread version histories are fixed
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

async function run() {
  const { count: threadCount } = (
    await models.sequelize.query(
      `SELECT COUNT(*) FROM "Threads" WHERE version_history_updated = false`,
      {
        raw: true,
        type: QueryTypes.SELECT,
      },
    )
  )[0];

  const count = parseInt(threadCount);
  let i = 0;
  while (i < count) {
    try {
      const threadVersionHistory: {
        id: number;
        addressId: number;
        versionHistories: { timestamp: string; body: string; author: string }[];
      }[] = (
        await models.sequelize.query(
          `SELECT id, address_id, version_history FROM "Threads" where version_history_updated = false LIMIT 10`,
          {
            raw: true,
            type: QueryTypes.SELECT,
          },
        )
      ).map((c) => ({
        id: parseInt(c.id),
        addressId: parseInt(c.address_id),
        versionHistories: c.version_history.map((v) => JSON.parse(v)),
      }));

      if (threadVersionHistory.length === 0) {
        break;
      }

      for (const versionHistory of threadVersionHistory) {
        console.log(
          `${i}/${count} Updating thread version_histories for id ${versionHistory.id}`,
        );

        const formattedValues = await Promise.all(
          versionHistory.versionHistories.map(async (v) => {
            const { author, ...rest } = v;
            let address = author?.['address'];

            // Address could not have been JSON decoded correctly.
            if (!address) {
              try {
                address = JSON.parse(author)?.address;
              } catch (e) {
                // do nothing, because we will try to query from database
              }
            }

            // If still undefined, as last resort get from database
            if (!address) {
              const result = await models.sequelize.query(
                `SELECT address FROM "Addresses" WHERE id = ${versionHistory.addressId}`,
                {
                  type: QueryTypes.SELECT,
                  raw: true,
                },
              );

              if (result.length > 0) {
                address = result[0].address;
              }
            }

            return {
              thread_id: versionHistory.id,
              ...rest,
              address,
            };
          }),
        );

        await models.sequelize.transaction(async (transaction) => {
          await models.sequelize.query(
            `UPDATE "Threads" SET version_history_updated = true WHERE id = $id`,
            {
              bind: { id: versionHistory.id },
              transaction,
            },
          );
          return await models.ThreadVersionHistory.bulkCreate(formattedValues, {
            transaction,
          });
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }

    i += 1;
  }

  console.log('Finished migration');
  process.exit(0);
}

run();
