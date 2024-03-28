import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

// const SequelizeStore = SessionSequelizeStore(session.Store);

// const sessionStore = new SequelizeStore({
//   db: models.sequelize,
//   tableName: 'Sessions',
//   checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
//   expiration: 7 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
// });

// const sessionParser = session({
//   secret: SESSION_SECRET,
//   store: sessionStore,
//   resave: false,
//   saveUninitialized: true,
// });

// export const app = express();
// before(async () => {

//   app.use('/static', express.static('static'));

//   app.use(json() as RequestHandler);
//   app.use(urlencoded({ extended: false }) as RequestHandler);
//   app.use(cookieParser());
//   app.use(sessionParser);
//   setupPassport(models);
//   app.use(passport.initialize());
//   app.use(passport.session());
// });

export async function get(
  path: string,
  val: Record<string, unknown> = null,
  expectError = false,
  passedApp,
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
  passedApp,
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
  expectedApp,
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
  expectedApp,
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
