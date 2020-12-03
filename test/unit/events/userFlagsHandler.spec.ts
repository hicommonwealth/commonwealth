/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import { CWEvent, SubstrateTypes } from '@commonwealth/chain-events';

import { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import StorageHandler from '../../../server/eventHandlers/storage';
import UserFlagsHandler from '../../../server/eventHandlers/userFlags';

chai.use(chaiHttp);
const { assert } = chai;

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, 'edgeware');
  return storageHandler.handle(event);
};

// add several addresses with some flags set and some unset
const addresses = [
  '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
  'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
  'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
];

describe('Edgeware Archival Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  beforeEach('reset address flags', async () => {
    const addressModel = await models['Address'].findOne({ where: {
      address: addresses[0],
    }});
    addressModel.is_councillor = true;
    addressModel.is_validator = true;
    await addressModel.save();
  });

  it('should sync councillors from NewTerm event', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.ElectionNewTerm,
        round: 5,
        allMembers: [
          'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
        ],
        newMembers: [ ],
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new UserFlagsHandler(models, 'edgeware');

    // process event
    await eventHandler.handle(event, dbEvent);

    // verify outputs
    const address1Model = await models['Address'].findOne({ where: {
      address: addresses[0],
    }});
    assert.equal(address1Model.is_councillor, false);
    const address2Model = await models['Address'].findOne({ where: {
      address: addresses[1],
    }});
    const address3Model = await models['Address'].findOne({ where: {
      address: addresses[2],
    }});
    assert.equal(address2Model.is_councillor, true);
    assert.equal(address3Model.is_councillor, true);
  });

  it('should sync councillors from EmptyTerm event', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.ElectionEmptyTerm,
        round: 5,
        members: [
          'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
        ],
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new UserFlagsHandler(models, 'edgeware');

    // process event
    await eventHandler.handle(event, dbEvent);

    // verify outputs
    const address1Model = await models['Address'].findOne({ where: {
      address: addresses[0],
    }});
    assert.equal(address1Model.is_councillor, false);
    const address2Model = await models['Address'].findOne({ where: {
      address: addresses[1],
    }});
    const address3Model = await models['Address'].findOne({ where: {
      address: addresses[2],
    }});
    assert.equal(address2Model.is_councillor, true);
    assert.equal(address3Model.is_councillor, true);
  });

  it('should sync validators from StakingElection event', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.StakingElection,
        era: 5,
        validators: [
          'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
        ],
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new UserFlagsHandler(models, 'edgeware');

    // process event
    await eventHandler.handle(event, dbEvent);

    // verify outputs
    const address1Model = await models['Address'].findOne({ where: {
      address: addresses[0],
    }});
    assert.equal(address1Model.is_validator, false);
    const address2Model = await models['Address'].findOne({ where: {
      address: addresses[1],
    }});
    const address3Model = await models['Address'].findOne({ where: {
      address: addresses[2],
    }});
    assert.equal(address2Model.is_validator, true);
    assert.equal(address3Model.is_validator, true);
  });

  it('should ignore unrelated event', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.Reward,
        amount: '500',
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new UserFlagsHandler(models, 'edgeware');

    // process event
    await eventHandler.handle(event, dbEvent);

    // verify outputs (unchanged)
    const address1Model = await models['Address'].findOne({ where: {
      address: addresses[0],
    }});
    assert.equal(address1Model.is_validator, true);
    const address2Model = await models['Address'].findOne({ where: {
      address: addresses[1],
    }});
    const address3Model = await models['Address'].findOne({ where: {
      address: addresses[2],
    }});
    assert.equal(address2Model.is_validator, false);
    assert.equal(address3Model.is_validator, false);
  });
});
