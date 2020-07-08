/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as TagErrors } from 'server/routes/editTag';
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
    console.log(res.body);
  });
});
