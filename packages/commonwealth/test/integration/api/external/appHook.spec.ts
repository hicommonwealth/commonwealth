import bodyParser from 'body-parser';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { SESSION_SECRET } from 'server/config';
import models from 'server/database';
import { addExternalRoutes } from 'server/routing/external';
import { tokenBalanceCache } from 'test/integration/api/external/cacheHooks.spec';

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
  app.use(passport.initialize());
  app.use(passport.session());

  const router = express.Router();
  addExternalRoutes(router, app, models, tokenBalanceCache);
  app.use('/api', router);
});

export async function get(
  path: string,
  val: Record<string, unknown> = null,
  expectError = false
) {
  const res = <any>(
    await chai
      .request(app)
      .get(path)
      .set('Accept', 'application/json')
      .query(val)
  );

  if (!expectError) assert.equal(res.statusCode, 200);

  if (res.statusCode === 404) throw Error(`Cannot find api for ${path}`);
  return JSON.parse(res.text);
}
