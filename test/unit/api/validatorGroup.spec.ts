/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase }  from '../../../server-test';
import * as modelUtils from '../../util/modelUtils';
import { JWT_SECRET } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

describe('Validator Groups Tests', () => {
  const chain = 'edgeware';

  let userJWT;
  let userAddress;

  before(async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  it('should create validator group for Edgeware', async () => {
    const res = await chai.request(app)
      .post('/api/createValidatorGroup')
      .set('Accept', 'application/json')
      .send({
        chain,
        jwt: userJWT,
        name: 'group 1',
        'stashes[]': ['alice']
      });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.result).to.not.be.null;
  });

  it('should get validator group for Edgeware', async () => {
    const res = await chai.request(app)
      .get('/api/getValidatorGroup')
      .set('Accept', 'application/json')
      .query({
        chain,
        jwt: userJWT
      });
    expect(res.body.status).to.be.equal('Success');
    expect(res.body.result).to.not.be.null;
  });
});
