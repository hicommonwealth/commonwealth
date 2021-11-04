import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import app from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
  it('Should receive a 400 error when requesting nonexistent chain', async () => {
    console.log(
      'trying test: Should receive a 400 error when requesting nonexistent chain'
    );

    console.log('making chai request');
    const res = await chai
      .request(app)
      .get('/api/viewOffchainVotes?chain=nonexistentchain')
      .set('Accept', 'application/json');
    console.log('received chai request');

    expect(res.status).to.be.equal(400);
    expect(res.body).to.not.be.null;
    expect(res.body.result).to.not.be.null;
  });
});
