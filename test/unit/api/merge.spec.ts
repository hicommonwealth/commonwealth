/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

import { Errors as createErrors } from '../../../server/routes/createRole';
import { Errors as upgradeErrors } from '../../../server/routes/upgradeMember';
import { Errors as deleteErrors } from '../../../server/routes/deleteRole';


chai.use(chaiHttp);
const { expect } = chai;

describe('Merge Account tests', () => {
  let userJWT;
  let userAddress1;
  let userAddress2;
  const chain = 'ethereum';
  const community = 'staking';
});