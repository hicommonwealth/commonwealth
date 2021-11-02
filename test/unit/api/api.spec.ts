import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import app from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
  describe('API Tests', () => {
    it('Should receive a 400 error when requesting nonexistent chain', async () => {
      let res;
      try {
        res = await chai
          .request(app)
          .get('/api/bulkOffchain?chain=nonexistentchain')
          .set('Accept', 'application/json');
      } catch (error) {
        console.log(error);
      }
      expect(res.status).to.be.equal(400);
      expect(res.body).to.not.be.null;
      expect(res.body.result).to.not.be.null;
    });
  });
});
