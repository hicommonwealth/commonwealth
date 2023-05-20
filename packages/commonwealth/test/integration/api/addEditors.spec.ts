import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../../server-test';
import { AddEditorsBody, Errors } from '../../../server/routes/addEditors';
import { get, post } from './external/appHook.spec';
import { testAddresses, testThreads } from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('addEditors Integration Tests', () => {
  it('should return an error response if there are validation errors', async () => {
    const invalidRequest = {
      thread_id: 'invalid',
      editors: [{ chain: 'invalid', address: 'invalid' }],
    };

    const response = await post('/api/addEditors', invalidRequest, false, app);

    response.should.have.status(400);
    response.body.should.have.property('status', 'Failure');
    response.body.should.have.property('errors').with.lengthOf(2);
    response.body.errors[0].should.have.property('msg', Errors.InvalidThread);
    response.body.errors[1].should.have.property(
      'msg',
      Errors.InvalidEditorFormat
    );
  });

  it('should return an error response if the thread does not exist', async () => {
    const nonExistentThreadId = '-12345678';

    const response = await get('/api/addEditors', {
      thread_id: nonExistentThreadId,
      editors: [],
    });

    response.should.have.status(500);
    response.body.should.have.property('status', 'Failure');
    response.body.should.have.property('errors').with.lengthOf(1);
    response.body.errors[0].should.have.property(
      'message',
      Errors.InvalidThread
    );
  });

  it('should add editors and return a success response', async () => {
    const testAddress = testAddresses.filter(
      (a) => a.id === testThreads[0].address_id
    )[0];
    const validRequest: AddEditorsBody = {
      thread_id: testThreads[0].id,
      editors: [{ chain: testAddress.chain, address: testAddress.address }],
    };

    const response = await chai
      .request(app)
      .get('/api/addEditors')
      .send(validRequest);

    response.should.have.status(200);
    response.body.should.have.property('status', 'Success');
    response.body.should.have.property('result');
    response.body.result.should.have.property('collaborators').with.lengthOf(2);
  });
});
