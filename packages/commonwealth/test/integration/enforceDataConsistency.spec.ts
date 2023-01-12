import chai from 'chai';
import { DATABASE_URI as CE_DB_URI } from 'chain-events/services/config';
import ceModels from 'chain-events/services/database/database';
import { QueryTypes } from 'sequelize';
import cwModels from '../../server/database';
import { enforceDataConsistency } from '../../server/scripts/enforceDataConsistency';

const { assert } = chai;

describe('Tests for enforceDataConsistency script', () => {
  it('Should copy chain-event-type ids from the CE db to the main db', async () => {
    const cetID = 'test-event-type';

    // ensure event type doesn't exist in either database
    await cwModels.ChainEventType.destroy({
      where: { id: cetID },
    });
    await ceModels.ChainEventType.destroy({
      where: { id: cetID },
    });

    // ensure type does not already exist in main db
    const cwResults = await cwModels.ChainEventType.findAll({
      where: { id: cetID },
    });
    assert.equal(cwResults.length, 0);

    // ensure type does not already exist in ce db
    const ceResults = await ceModels.ChainEventType.findAll({
      where: { id: cetID },
    });
    assert.equal(ceResults.length, 0);

    // add test event type to ce db
    await ceModels.sequelize.query(
      `
      INSERT INTO "ChainEventTypes" (id, chain, event_name, event_network, queued) VALUES
        ('${cetID}', 'edgeware', 'some-event-name', 'substrate', -1);
    `,
      { raw: true, type: QueryTypes.INSERT, logging: console.log }
    );

    // run consistency script
    await enforceDataConsistency(CE_DB_URI, true, false);

    // ensure type id has been transferred to cw db
    const newResults = await cwModels.ChainEventType.findAll({
      where: { id: cetID },
    });
    assert.equal(newResults.length, 1);

    await cwModels.ChainEventType.destroy({
      where: { id: cetID },
    });

    await ceModels.ChainEventType.destroy({
      where: { id: cetID },
    });
  });

  it('Should copy chain-entities from the CE db to the main db', async () => {
    const author = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const { id } = await ceModels.ChainEntity.create({
      chain: 'edgeware',
      type: 'test-type',
      type_id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      author,
      completed: false,
      queued: -1,
    });

    // run consistency script
    await enforceDataConsistency(CE_DB_URI, false, true);

    // ensure type id has been transferred to cw db
    const newResults = await cwModels.ChainEntityMeta.findAll({
      where: { ce_id: id },
    });
    assert.equal(newResults.length, 1);
    assert.equal(newResults[0].author, author);

    await cwModels.ChainEntityMeta.destroy({
      where: { ce_id: id },
    });
    await ceModels.ChainEntity.destroy({
      where: { id },
    });
  });
});
