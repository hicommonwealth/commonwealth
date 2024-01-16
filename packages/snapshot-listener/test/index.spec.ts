import chai, { expect } from 'chai';
import * as dotenv from 'dotenv';
import chaiHttp = require('chai-http');
dotenv.config();

chai.use(chaiHttp);

describe('Snapshot Listener API', () => {
  const localhost = 'http://localhost:' + process.env.PORT;

  it('/ should return OK', async () => {
    const res = await chai.request(localhost).get('/');
    expect(res).to.have.status(200);
    expect(res.text).to.equal('OK!');
  });

  it('/snapthot should return 201 when valid JSON is sent', async () => {
    const res = await chai
      .request(localhost)
      .post('/snapshot')
      .send({ event: 'test' });
    expect(res).to.have.status(201);
    expect(res.text).to.equal('Snapshot event sent: "test"');
  });

  it('/snapshot should return 500 with no data', async () => {
    const res = await chai.request(localhost).post('/snapshot').send(undefined);
    expect(res).to.have.status(500);
    expect(res.text).to.equal('Error sending snapshot event');
  });

  it('should return 500', async () => {
    const res = await chai
      .request(localhost)
      .post('/snapshot')
      .send({ event: undefined });
    expect(res).to.have.status(500);
    expect(res.text).to.equal('Error sending snapshot event');
  });
});
