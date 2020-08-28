/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');


describe('Event Tests', () => {
  const chain = 'edgeware';

  it('should grab all reward events for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getRewards')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.validators).to.not.be.null;
  });

  it('should grab getOwnStakeOverTime for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getOwnStakeOverTime')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.validators).to.not.be.null;
  });

  it('should grab getOtherStakeOverTime for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getOtherStakeOverTime')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.validators).to.not.be.null;
  });

  it('should grab getTotalStakeOverTime for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getTotalStakeOverTime')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.validators).to.not.be.null;
  });

  it('should grab getNominatorsOverTime for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getNominatorsOverTime')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.nominators).to.not.be.null;
  });
});
