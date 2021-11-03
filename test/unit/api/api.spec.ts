import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import app from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', function () {
  it('Should receive a 400 error when requesting nonexistent chain', async () => {
    let res;
    console.log(
      'trying test: Should receive a 400 error when requesting nonexistent chain'
    );
    try {
      console.log('making chai request');
      res = await chai
        .request(app)
        .get('/api/viewOffchainVotes?chain=nonexistentchain')
        .set('Accept', 'application/json');
      console.log('received chai request');
    } catch (error) {
      console.log('error encountered', error);
    }
    console.log('res result', res);
    expect(res.status).to.be.equal(400);
    expect(res.body).to.not.be.null;
    expect(res.body.result).to.not.be.null;
  }).timeout(50000);
});
