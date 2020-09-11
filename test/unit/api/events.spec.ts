/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import app from '../../../server-test';

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

  it('should grab all imonline events for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getImOnline')
      .set('Accept', 'application/json')
      .query({ chain });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.slashes).to.not.be.null;
  });
});
