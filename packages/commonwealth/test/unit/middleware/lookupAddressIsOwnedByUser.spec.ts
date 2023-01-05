import { assert } from 'chai';

import MockExpressRequest from 'mock-express-request';
import lookupAddressIsOwnedByUser from '../../../server/middleware/lookupAddressIsOwnedByUser';
import models from '../../../server/database';

describe('lookupAddressIsOwnedByUser() unit tests', () => {

  it('should look up address of logged in user successfully', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      author_chain: 'ethereum',
      address: '0x123',
    };
    request.body = resBody;
    request.user = { id: 1 };

    const [author] = await lookupAddressIsOwnedByUser(models, request);
    assert.equal(author.name, 'test-user');
  });

  it('should return null if user is not logged in', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      author_chain: 'ethereum',
      address: '0x123',
    };
    request.body = resBody;

    const [author, error] = await lookupAddressIsOwnedByUser(models, request);
    assert.equal(author, null);
    assert.equal(error, 'Not logged in');
  });

  it('should return null if body does not define author_chain', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      address: '0x123',
    };
    request.body = resBody;
    request.user = { id: 1 };

    const [author, error] = await lookupAddressIsOwnedByUser(models, request);
    assert.equal(author, null);
    assert.equal(error, 'Invalid public key/chain');
  })

  it('should return null if address instance returned does not exist', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      author_chain: 'ethereum',
      address: 'not-found',
    };
    request.body = resBody;
    request.user = { id: 2 };

    const [author, error] = await lookupAddressIsOwnedByUser(models, request);
    assert.equal(author, null);
    assert.equal(error, 'Invalid public key/chain');
  })

});
