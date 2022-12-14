/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { Errors as DeleteDraftErrors } from 'server/routes/drafts/deleteDraft';
import { Errors as CreateDraftErrors } from 'server/routes/drafts/createDraft';
import { Errors as EditDraftErrors } from 'server/routes/drafts/editDraft';
import MockExpressRequest from 'mock-express-request';
import app, { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
import DatabaseValidationService from '../../../server/middleware/databaseValidationService';

chai.use(chaiHttp);
const { expect } = chai;

describe('DatabaseValidationService Tests', () => {
  const chain = 'ethereum';

  const title = 'test title';
  const body = 'test body';
  const topic = 'test topic';

  let userJWT;
  let userAddress;
  let userId;
  let user2Address;
  let user2JWT;
  let user2Id;

  before(async function () {
    this.timeout(300000);
    await resetDatabase();
    console.log('Database reset');

    let res = await modelUtils.createAndVerifyAddress({ chain });
    user2Address = res.address;
    user2JWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    user2Id = res.user_id;
    expect(user2Address).to.not.be.null;
    expect(user2JWT).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    userId = res.user_id;
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('validateAuthor', () => {
    it('should successfully validate author if address exists for user', async () => {
      const request = new MockExpressRequest();

      const resBody = {
        address: userAddress,
        author_chain: chain,
        chain,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = { id: userId };
      expect(DatabaseValidationService.validateAuthor(models, request, null, () => {
        return null;
      })).to.not.throw;
    });
  });

  it('should fail if no user is given', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      address: userAddress,
      author_chain: chain,
      chain,
      title,
      topic,
      body,
      jwt: userJWT,
    };
    request.body = resBody;
    request.user = null;
    DatabaseValidationService.validateAuthor(models, request, null, () => {
      return null;
    });
    expect(request.address).to.be.undefined;
  });

  it('should fail if no address or author chain is given', async () => {
    const request = new MockExpressRequest();

    const resBody = {
      chain,
      title,
      topic,
      body,
      jwt: userJWT,
    };
    request.body = resBody;
    request.user = { id: userId };
    DatabaseValidationService.validateAuthor(models, request, null, () => {
      return null;
    });
    expect(request.address).to.be.undefined;
  });
});
