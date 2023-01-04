import chai from 'chai';
import { mockDb } from 'server/models/mocks/mockDatabase';
import validateChain from '../../../server/middleware/validateChain';

describe('ValidateChain tests', () => {
  it('should fail if the url provided doesn\'t exist', async () => {
    validateChain(mockDb, { chain: 'ethereum' });
  });
});