/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { Errors as DeleteDraftErrors } from 'server/routes/drafts/deleteDraft';
import { Errors as CreateDraftErrors } from 'server/routes/drafts/createDraft';
import { Errors as EditDraftErrors } from 'server/routes/drafts/editDraft';
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
  const topic = 'test topic';

  let userJWT;
  let userAddress;
  let user2Address;
  let user2JWT;

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    user2Address = res.address;
    user2JWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(user2Address).to.not.be.null;
    expect(user2JWT).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
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
          'topic': topic,
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
          'topic': topic,
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
          'topic': topic,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
      expect(result.body).to.equal(body);
      expect(result.topic).to.equal(topic);
      expect(result.Address).to.not.be.null;
      expect(result.Address.address).to.equal(userAddress);
    });

    it('should create a discussion draft without a topic', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': title,
          'topic': null,
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

    it('should fail to create a discussion draft missing a body, title, and attachment', async () => {
      const res = await chai.request(app)
        .post('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'title': null,
          'topic': topic,
          'body': null,
          'attachments[]': null,
          'jwt': userJWT,
        });
      expect(res).to.not.have.status(200);
      expect(res.body.error).to.equal(CreateDraftErrors.InsufficientData);
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
          'topic': topic,
          'body': body,
          'jwt': userJWT,
        });
      expect(res).to.have.status(200);
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
          'topic': `${topic} edited`,
          'body': `${body} edited`,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result.title).to.equal(`${title} edited`);
      expect(result.topic).to.equal(`${topic} edited`);
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
          'topic': topic,
          'body': body,
          'jwt': userJWT,
        });
      const { result } = res.body;
      expect(res).to.not.have.status(200);
      expect(res.body.error).to.equal(EditDraftErrors.NoId);
    });

    it('should fail to edit a draft when attempted by non-owning user', async () => {
      const res = await chai.request(app)
        .patch('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': user2Address,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'id': firstDraft.id,
          'title': title,
          'topic': topic,
          'body': body,
          'jwt': user2JWT,
        });
      const { result } = res.body;
      expect(res).to.not.have.status(200);
      expect(res.body.error).to.equal(EditDraftErrors.NotFound);
    });
  });

  describe('/deleteDraft', () => {
    let draft;
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
          'topic': topic,
          'body': body,
          'jwt': userJWT,
        });
      draft = res.body.result;
    });

    it('should delete a provided draft', async () => {
      const res = await chai.request(app)
        .delete('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': userAddress,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'id': draft.id,
          'jwt': userJWT
        });
      const { result } = res.body;
      expect(res).to.have.status(200);
      expect(result).to.not.be.null;
    });

    it('should fail to delete a provided draft when attempted by non-owning user', async () => {
      const res = await chai.request(app)
        .delete('/api/drafts')
        .set('Accept', 'application/json')
        .send({
          'address': user2Address,
          'author_chain': chain,
          'chain': chain,
          'community': null,
          'id': draft.id,
          'jwt': user2JWT
        });
      const { result } = res.body;
      expect(res).to.not.have.status(200);
      expect(res.body.error).to.be.equal(DeleteDraftErrors.NotFound);
    });
  });
});
