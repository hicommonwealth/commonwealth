/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';

import { resetDatabase } from '../../../../server-test';
import models from '../../../../server/database';
import { NotificationCategories } from '../../../../shared/types';
import { CWEvent } from '../../../../shared/events/interfaces';
import { SubstrateEventKind } from '../../../../shared/events/edgeware/types';

chai.use(chaiHttp);
const { assert } = chai;

describe('Edgeware Archival Event Handler Tests', () => {
  before('reset database', async () => {
  });

  it('should create chain entity from event', async () => {

  });

  it('should update chain entity from event', async () => {

  });

  it('should ignore duplicate events', async () => {

  });

  it('should create ignore unrelated events', async () => {

  });
});
