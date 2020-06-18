/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as ThreadErrors } from 'server/routes/createThread';
import { Errors as EditThreadErrors } from 'server/routes/editThread';
import { Errors as CreateCommentErrors } from 'server/routes/createComment';
import { Errors as ViewCountErrors } from 'server/routes/viewCount';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Draft Tests', () => {
  const community = 'staking';
  const chain = 'ethereum';

  const title = 'test title';
  const body = 'test body';
  const tagName = 'test tag';
  const tagId = undefined;
  const kind = 'forum';

  let adminJWT;
  let adminAddress;
  let userJWT;
  let userId;
  let userAddress;
  let thread;

  before(async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userId = res.user_id;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('/createDraft', () => {
    it('should create a discussion draft with all thread params', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': community,
          'title': title,
          'tag': tagName,
          'body': body,
          'jwt': userJWT,
        });
      // expect(res).to.have.status(200);
      expect(res.body.result).to.not.be.null;
      // expect(res.body.result.title).to.equal(encodeURIComponent(title));
      // expect(res.body.result.body).to.equal(encodeURIComponent(body));
      // expect(res.body.result.Address).to.not.be.null;
      // expect(res.body.result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a title', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': community,
          'title': undefined,
          'tag': tagName,
          'body': body,
          'jwt': userJWT,
        });
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.title).to.equal(encodeURIComponent(title));
      expect(res.body.result.body).to.equal(encodeURIComponent(body));
      expect(res.body.result.tag).to.equal(tagName);
      expect(res.body.result.Address).to.not.be.null;
      expect(res.body.result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a body', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': community,
          'title': title,
          'tag': tagName,
          'body': undefined,
          'jwt': userJWT,
        });
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.title).to.equal(encodeURIComponent(title));
      expect(res.body.result.tag).to.equal(tagName);
      expect(res.body.result.Address).to.not.be.null;
      expect(res.body.result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a tag', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': community,
          'title': title,
          'tag': undefined,
          'body': body,
          'jwt': userJWT,
        });
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.title).to.equal(encodeURIComponent(title));
      expect(res.body.result.body).to.equal(encodeURIComponent(body));
      expect(res.body.result.Address).to.not.be.null;
      expect(res.body.result.Address.address).to.equal(userAddress);
    });

    it('should fail to create a discussion draft missing a body and attachment', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': community,
          'title': title,
          'tag': tagName,
          'body': undefined,
          'attachments[]': undefined,
          'jwt': userJWT,
        });
      expect(res.body.status).to.not.equal('Success');
    });
  });

  describe('/getDrafts', () => {
    it('should return drafts for a given user', async () => {
      const res = await chai.request(app)
        .get('/api/drafts')
        .query({});
      expect(res.body.result).to.not.be.null;
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });
  });
});
