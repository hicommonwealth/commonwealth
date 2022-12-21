import { assert } from 'chai';
import { Sequelize, DataTypes } from 'sequelize';

import MockExpressRequest from 'mock-express-request';
import lookupAddressIsOwnedByUser from '../../../server/middleware/lookupAddressIsOwnedByUser';
import { db } from '../../../server/models/mocks/mockDatabase';

describe('lookupAddressIsOwnedByUser() unit tests', () => {
  it('should return highest role', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      address: '0x123',
    };
    request.body = resBody;
    request.user = { id: 0 };

    const [role] = await lookupAddressIsOwnedByUser(db, request);
  });
});
