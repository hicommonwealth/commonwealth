import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'server/config';
import { resetDatabase } from '../../../server-test';
import * as modelUtils from 'test/util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Thread Patch Update', () => {
  const chain = 'ethereum';

  let adminJWT;
  let adminUserId;
  let adminAddress;
  let adminAddressId;

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;

  before(async () => {
    await resetDatabase();
    const adminRes = await modelUtils.createAndVerifyAddress({ chain });
    {
      adminAddress = adminRes.address;
      adminUserId = adminRes.user_id;
      adminAddressId = adminRes.address_id;
      adminJWT = jwt.sign(
        { id: adminRes.user_id, email: adminRes.email },
        JWT_SECRET
      );
      const isAdmin = await modelUtils.updateRole({
        address_id: adminRes.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    }

    const userRes = await modelUtils.createAndVerifyAddress({ chain });
    {
      userAddress = userRes.address;
      userId = userRes.user_id;
      userAddressId = userRes.address_id;
      userJWT = jwt.sign(
        { id: userRes.user_id, email: userRes.email },
        JWT_SECRET
      );
      expect(userAddress).to.not.be.null;
      expect(userJWT).to.not.be.null;
    }
  });

  describe('BLAH', () => {
    expect(1).to.be.true;
  });
});
