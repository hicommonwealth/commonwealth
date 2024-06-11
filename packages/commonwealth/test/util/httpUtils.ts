import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

export async function get(
  path: string,
  // @ts-expect-error StrictNullChecks
  val: Record<string, unknown> = null,
  expectError = false,
  passedApp,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function post(
  path: string,
  val: Record<string, unknown>,
  expectError = false,
  expectedApp,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
