
import chai from 'chai';
import chaiHttp from 'chai-http';
import superagent from 'superagent';
import 'chai/register-should';
import sleep from 'sleep-promise';
import app from '../../../server-test';
chai.use(chaiHttp);
const { assert } = chai;

const MOCK_URL = 'http://127.0.0.1:4000';

/**
 * This test expects both the server to be running and updating rapidly (cf. `yarn start-ci`),
 * and the mockGraphqlProvider to be running such that the server is loading its data.
 */

// these variables describe the properties and initial state of the object type
// as provided by the mock server
let OBJECT_TYPE;
let IDENTIFIER_FIELD;
let COMPLETED_FIELD;
let N_INITIAL_PROPOSALS;

// verifies a row's contents against the raw object data fetched from the mock provider
const verifyRow = (row) => {
  const proposal = JSON.parse(row.object_data);
  assert.equal(proposal[IDENTIFIER_FIELD], row.object_id, 'object id field does not match raw data');
  assert.equal(proposal[COMPLETED_FIELD], row.completed, 'completed field does not match raw data');

  // this is present in TestProposalv1 but not generically available
  assert.isString(proposal.description, 'data missing description field');
};

// makes a GET request against the mock provider
// TODO XXX: Address these (resp as any) typings
const getMock = async (path) => {
  const resp = await superagent.get(`${MOCK_URL}${path}`)
    .set('Accept', 'application/json');
  assert.isTrue(resp.body.success, 'mock request failed');
  return resp.body;
};

// makes a /viewChainObjects GET against the server
const viewChainObjects = async (argObj) => {
  let argString = `object_type=${OBJECT_TYPE}&`;
  for (const [k, v] of Object.entries(argObj)) {
    argString += `${k}=${v}&`;
  }
  const resp = await chai.request.agent(app)
    .get(`/api/viewChainObjects?${argString}`)
    .set('Accept', 'application/json');
  assert.equal(resp.body.status, 'Success', 'viewChainObjects failed');
  for (const row of resp.body.result) {
    verifyRow(row);
  }
  return resp.body.result;
};

// these variables describe the new object which will be added to the db and whose
// state will be updated throughout
let NEW_OBJECT_ID;
const NEW_DESCRIPTION = 'hello world';

// eslint-disable-next-line no-undef
describe('chainObjectFetcher', () => {
  it('fetch metadata from mock provider', async () => {
    const mockData = await getMock('/info');
    OBJECT_TYPE = mockData.version.id;
    IDENTIFIER_FIELD = mockData.version.unique_identifier;
    COMPLETED_FIELD = mockData.version.completion_field;
    N_INITIAL_PROPOSALS = +mockData.n;
  });

  it.skip('should fetch expected chain objects from db', async () => {
    const objectRows = await viewChainObjects({});
    console.log(objectRows);
    assert.lengthOf(objectRows, N_INITIAL_PROPOSALS, 'fetched wrong number of rows');
  });

  it('add item to mock provider', async () => {
    const update = await getMock('/add');
    assert.lengthOf(update.added_ids, 1, 'invalid # of mocks added');
    NEW_OBJECT_ID = update.added_ids[0];
    return sleep(1000);
  });

  it.skip('should add a new chain object to db', async () => {
    const objectRows = await viewChainObjects({ completed: false });
    assert.isAtLeast(objectRows.length, 1, 'no proposals found');
    assert(!!objectRows.find((row) => +row.object_id === NEW_OBJECT_ID), 'new object not found');
    objectRows.forEach((row) => assert.isFalse(row.completed, 'row should not be false'));
  });

  it('update new object description on mock provider', async () => {
    assert.isDefined(NEW_OBJECT_ID, 'test object is undefined');
    await getMock(`/description?id=${NEW_OBJECT_ID}&description=${encodeURIComponent(NEW_DESCRIPTION)}`);
    return sleep(1000);
  });

  it.skip('should update the description of new object in db', async () => {
    const objectRows = await viewChainObjects({ object_id: NEW_OBJECT_ID });
    assert.lengthOf(objectRows, 1, 'should only recieve one object');
    const [ row ] = objectRows;
    assert.isFalse(row.completed, 'row should not be completed');
    assert.equal(+row.object_id, NEW_OBJECT_ID, 'row has wrong object_id');
    const proposal = JSON.parse(row.object_data);
    assert.equal(proposal.description, NEW_DESCRIPTION, 'row has wrong description');
  });

  it('complete new object on mock provider', async () => {
    assert.isDefined(NEW_OBJECT_ID, 'test object is undefined');
    await getMock(`/complete?id=${NEW_OBJECT_ID}`);
    return sleep(1000);
  });

  it.skip('should complete the new object in db', async () => {
    const objectRows = await viewChainObjects({ object_id: NEW_OBJECT_ID });
    assert.lengthOf(objectRows, 1, 'should only recieve one object');
    const [ row ] = objectRows;
    assert.equal(+row.object_id, NEW_OBJECT_ID, 'row has wrong object_id');
    assert.isTrue(row.completed, 'row should be completed');
  });
});
