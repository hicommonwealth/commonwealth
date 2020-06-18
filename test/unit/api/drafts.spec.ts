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
  const tag = 'test tag';

  let userJWT;
  let userId;
  let userAddress;

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
    it('should successfully create a community discussion draft with all reqd params', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': title,
          'tag': tag,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
      expect(result.title).to.equal(title);
      expect(result.body).to.equal(body);
      expect(result.Address).to.not.be.null;
      expect(result.Address.address).to.equal(userAddress);
    });

    it('should successfully create a chain discussion draft with all reqd params', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': null,
          'community': community,
          'title': title,
          'tag': tag,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
      expect(result.title).to.equal(title);
      expect(result.body).to.equal(body);
      expect(result.Address).to.not.be.null;
      expect(result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a title', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': null,
          'tag': tag,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
      expect(result.body).to.equal(body);
      expect(result.tag).to.equal(tag);
      expect(result.Address).to.not.be.null;
      expect(result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a tag', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': title,
          'tag': null,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
      expect(result.title).to.equal(title);
      expect(result.body).to.equal(body);
      expect(result.Address).to.not.be.null;
      expect(result.Address.address).to.equal(userAddress);
    });

    it('should fail to create a discussion draft missing a body and attachment', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': title,
          'tag': tag,
          'body': null,
          'attachments[]': null,
          'jwt': userJWT,
        });
      expect(res).to.not.have.status(200);
    });
  });

  describe('/editDraft', () => {
    let firstDraft;
    beforeEach(async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': title,
          'tag': tag,
          'body': body,
          'jwt': userJWT,
        });
      firstDraft = res.body.result;
    });

    it('should successfully edit a draft', async () => {
      const res = await chai.request(app)
        .patch('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'id': firstDraft.id,
          'title': `${title} edited`,
          'tag': `${tag} edited`,
          'body': `${body} edited`,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result.title).to.equal(`${title} edited`);
      expect(result.tag).to.equal(`${tag} edited`);
      expect(result.body).to.equal(`${body} edited`);
    });

    it('should fail to edit a draft when missing an id', async () => {
      const res = await chai.request(app)
        .patch('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'id': null,
          'title': title,
          'tag': tag,
          'body': body,
          'jwt': userJWT,
        });
      expect(res).to.not.have.status(200);
    });
  });

  describe('/getDrafts', () => {
    it('should return drafts for a given user', async () => {
      const res = await chai.request(app)
        .get('/api/drafts')
        .set('Accept', 'application/json')
        .query({
          'jwt': userJWT
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
    });
  });
});
