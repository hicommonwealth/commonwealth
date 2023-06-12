import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { Errors } from '../../../server/routes/threads/create_thread_comment_handler';
import { post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('createComment Integration Tests', () => {
  let jwtTokenUser1;

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET
    );
  });

  it('should return an error response if no text is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      address: testAddresses[0].address,
      thread_id: testThreads[0].id,
    };

    const response = await post(
      `/api/threads/${testThreads[0].id}/comments`,
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.MissingTextOrAttachment);
  });

  it('should return an error response if an invalid parent id is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      address: testAddresses[0].address,
      thread_id: testThreads[0].id,
      parent_id: -10,
      text: 'test',
    };

    const response = await post(
      `/api/threads/${testThreads[0].id}/comments`,
      invalidRequest,
      true,
      app
    );

    chai.assert.equal(response.error, Errors.InvalidParent);
  });

  it('should create comment and return a success response', async () => {
    const time = new Date().getMilliseconds();
    const text = `testCommentCreated at ${time}`;

    const validRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      address: testAddresses[0].address,
      text,
    };

    let actualComment = await models.Comment.findOne({
      where: { text },
    });

    chai.assert.isNull(actualComment);

    const response = await post(
      `/api/threads/${testThreads[0].id}/comments`,
      validRequest,
      true,
      app
    );

    actualComment = await models.Comment.findOne({
      where: { text },
    });

    chai.assert.isNotNull(actualComment);
    chai.assert.equal(response.status, 'Success');
  });
});
