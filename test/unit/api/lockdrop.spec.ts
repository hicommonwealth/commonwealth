/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import app, { resetDatabase } from '../../../server-test';
chai.use(chaiHttp);
const { expect } = chai;

describe('Edgeware Lockdrop Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it.only('should fetch the lockdrop stats', async () => {
    const network = 'mainnet';
    const res = await chai.request(app)
      .get('/api/edgewareLockdropStats')
      .set('Accept', 'application/json')
      .query({ network });
    console.log(res.body);
  }).timeout(500000);
});
