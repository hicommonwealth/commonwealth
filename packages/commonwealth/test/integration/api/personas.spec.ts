/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { Errors as PersonaErrors } from 'server/routes/personas/personas';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from 'server/config';
import * as modelUtils from 'test/util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Persona API Tests', () => {
  // Test data for personas
  const testPersonas = [
    {
      name: 'Alice',
      personality:
        'Alice is a software engineer who loves to solve complex problems and learn new programming languages.',
    },
    {
      name: 'Bob',
      personality:
        'Bob is a data scientist who enjoys working with large datasets and finding patterns in data.',
    },
  ];

  let jwtToken, adminUserId, loggedInAddr, loggedInAddrId, personaId;

  before('reset database', async () => {
    await resetDatabase();
    const chain = 'ethereum';
    const res = await modelUtils.createAndVerifyAddress({ chain: chain });
    loggedInAddr = res.address;
    loggedInAddrId = res.address_id;
    jwtToken = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
  });

  describe('persona tests', () => {
    // Test the createPersona function
    it('should create a persona', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/personas/create')
        .set('Accept', 'application/json')
        .send({ ...testPersonas[0], jwt: jwtToken });
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.persona.id).to.be.not.null;
      personaId = res.body.result.persona.id;
      expect(res.body.result.persona.name).to.be.equal(testPersonas[0].name);
      expect(res.body.result.persona.personality).to.be.equal(
        testPersonas[0].personality
      );
    });

    // Test the getPersonas function
    it('should get personas', async () => {
      const res = await chai.request
        .agent(app)
        .get('/api/personas/get')
        .set('Accept', 'application/json')
        .send({ name: testPersonas[0].name, jwt: jwtToken });

      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.persona[0].id).to.equal(personaId);
      expect(res.body.result.persona.length).to.equal(1);
    });

    // Test the updatePersona function
    it('should update a persona', async () => {
      const updatedPersona = {
        id: personaId,
        name: 'Alice',
        personality:
          'Alice is a software engineer who loves to solve complex problems and learn new programming languages.',
      };

      const res = await chai.request
        .agent(app)
        .put('/api/personas/update')
        .set('Accept', 'application/json')
        .send({
          id: updatedPersona.id,
          name: updatedPersona.name,
          personality: updatedPersona.personality,
          jwt: jwtToken,
        });

      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.persona.name).to.equal(updatedPersona.name);
      expect(res.body.result.persona.personality).to.equal(
        updatedPersona.personality
      );
    });

    // Test the deletePersona function
    it('should delete a persona', async () => {
      const personaIdToDelete = personaId; // Assuming Alice's ID is 1

      const res = await chai.request
        .agent(app)
        .delete('/api/personas/delete')
        .set('Accept', 'application/json')
        .send({ id: personaIdToDelete, jwt: jwtToken });

      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.id).to.equal(personaIdToDelete);
      expect(res.body.result.message).to.equal('Persona deleted successfully');
    });
  });
});
