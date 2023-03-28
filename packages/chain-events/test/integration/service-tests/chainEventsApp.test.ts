import chai from 'chai';
import chaiHttp from 'chai-http';

import { Errors as EntityErrors } from '../../../services/app/routes/entities';
import { Errors as EventErrors } from '../../../services/app/routes/eventActivity';
import {createChainEventsApp} from "../../../services/app/Server";

chai.use(chaiHttp);
const { expect } = chai;

let app;

describe('Tests for the App service', () => {
  before(async () => {
    app = (await createChainEventsApp()).listen();
  });

  describe('Tests for /entities', () => {
    it('Should return entities for a specific chain', async () => {
      const result = await chai
        .request(app)
        .get('/api/entities?chain=dydx')
        .set('Accept', 'application/json');

      expect(result.status).to.be.equal(200);
      expect(result.body).to.not.be.null;
      expect(result.body.result).to.not.be.null;
    });

    it('Should fail if a chain is not provided', async () => {
      const result = await chai
        .request(app)
        .get('/api/entities')
        .set('Accept', 'application/json');

      expect(result.status).to.be.equal(400);
      expect(result.text.includes(EntityErrors.NeedChain)).to.be.true;
    });
  });

  describe('Tests for /events', async () => {
    it('Should return a limited number of events from any chain', async () => {
      const limit = 13;
      const result = await chai
        .request(app)
        .get(`/api/events?limit=${limit}`)
        .set('Accept', 'application/json');

      expect(result.status).to.be.equal(200);
      expect(result.body).to.not.be.null;
      expect(result.body.result).to.not.be.null;
      expect(result.body.result).to.have.property('length');
      expect(result.body.result.length).to.be.equal(limit);
    });

    it('Should fail if a limit number is not provided', async () => {
      const limit = 13;
      const result = await chai
        .request(app)
        .get(`/api/events`)
        .set('Accept', 'application/json');

      expect(result.status).to.be.equal(400);
      expect(result.text.includes(EventErrors.NeedLimit)).to.be.true;
    });
  });

  /**
   * These tests will be made once ChainEventsSubscriber is refactored to allow better
   * visibility into the chains being listened to and their status. As it stands, I could
   * post listener info to the ChainEventsApp but that would serve little purpose as the
   * data would be minimal/inconsequential due to the way the ChainSubscriber is set up
   */
  xit('Should support posting ChainSubscriber status data');
  xit('Should be able to fetch ChainSubscriber status data');
});
