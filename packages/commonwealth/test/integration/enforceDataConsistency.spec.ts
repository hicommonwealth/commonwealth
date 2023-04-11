import chai from 'chai';
import { DATABASE_URI as CE_DB_URI } from 'chain-events/services/config';
import ceModels from 'chain-events/services/database/database';
import { QueryTypes } from 'sequelize';
import cwModels from '../../server/database';
import { enforceDataConsistency } from '../../server/scripts/enforceDataConsistency';

const { assert } = chai;

describe('Tests for enforceDataConsistency script', () => {
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
    await enforceDataConsistency(CE_DB_URI, true);

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
