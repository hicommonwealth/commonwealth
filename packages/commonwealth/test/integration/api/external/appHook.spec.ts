import { models } from '@hicommonwealth/model';
import bodyParser from 'body-parser';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { SESSION_SECRET } from 'server/config';
import setupPassport from '../../../../server/passport/index';

chai.use(chaiHttp);

const SequelizeStore = SessionSequelizeStore(session.Store);

const sessionStore = new SequelizeStore({
  db: models.sequelize,
  tableName: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 7 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
});

const sessionParser = session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
});

export const app = express();
before(async () => {
  app.use('/static', express.static('static'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(sessionParser);
  setupPassport(models);
  app.use(passport.initialize());
  app.use(passport.session());
});

export async function get(
  path: string,
  val: Record<string, unknown> = null,
  expectError = false,
  passedApp = app,
) {
  const res = <any>(
    await chai
      .request(passedApp)
      .get(path)
      .set('Accept', 'application/json')
      .query(val)
  );

  if (!expectError) {
    assert.equal(res.statusCode, 200);
  } else if (res.text === 'Unauthorized') {
    return res;
  }

  return JSON.parse(res.text);
}

export async function put(
  path: string,
  val: Record<string, unknown>,
  expectError = false,
  passedApp = app,
) {
  const res = <any>(
    await chai
      .request(passedApp)
      .put(path)
      .set('Accept', 'application/json')
      .send(val)
  );

  if (!expectError) {
    assert.equal(res.statusCode, 200);
  } else if (res.text === 'Unauthorized') {
    return res;
  }

  return JSON.parse(res.text);
}

export async function post(
  path: string,
  val: Record<string, unknown>,
  expectError = false,
  expectedApp = app,
) {
  const res = <any>(
    await chai
      .request(expectedApp)
      .post(path)
      .set('Accept', 'application/json')
      .send(val)
  );

  if (!expectError) {
    assert.equal(res.statusCode, 200);
  } else if (res.text === 'Unauthorized') {
    return res;
  }

  return JSON.parse(res.text);
}

export async function del(
  path: string,
  val: Record<string, unknown>,
  expectError = false,
  expectedApp = app,
) {
  const res = <any>(
    await chai
      .request(expectedApp)
      .delete(path)
      .set('Accept', 'application/json')
      .send(val)
  );

  if (!expectError) {
    console.log(res.text);
    assert.equal(res.statusCode, 200);
  } else if (res.text === 'Unauthorized') {
    return res;
  }

  return JSON.parse(res.text);
}
