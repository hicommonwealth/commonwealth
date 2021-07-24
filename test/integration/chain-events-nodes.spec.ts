import chai from 'chai';
const { assert } = chai;
import { spawn } from 'child_process'

async function populateIdentityCache() {

}

function delay(interval) {
  return it('delaying...', (done) => {
    setTimeout(() => done(), interval);
  }).timeout(interval + 100);
}

// LOOP through all the chains individually to test functionality for all chains
describe('Tests for starting chain-event nodes', () => {
  let child
  populateIdentityCache().then(() => {
    child = spawn('TESTING=true WORKER_NUMBER=6 NUM_WORKERS=29 HANDLE_IDENTITY=publish ts-node --project ../../server/scripts/tsconfig.consumer.json ../../server/scripts/dbNode.ts');
  })

  // sleep for 5 seconds to give time for the chain-events node to wake up + start listeners
  it("Wait for chain-events to initialize", () => {
    delay(5000)
  })

  describe('Test for chain-events nodes', () => {
    it('The chain-events node should start listeners for the assigned chains', async () => {
      const res = await fetch("http://localhost:8081/getListeners", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const listeners = await res.json()

      assert.equal(res.status, 200);
      assert.isNotNull(listeners['polkadot']);
    })

    it('Should consume and clear the identity cache for the nodes chains', async () => {
      // check identity cache is empty
      // check the proper number of messages have been queued in the identity queue:
      // https://stackoverflow.com/questions/33984504/rabbitmq-with-nodejs-using-amqplib-to-get-message-count
    })
    it('Should change the chains listened to if chains are updated in the database', async () => {})
  })

  describe('Tests for the chain-events consumer', () => {
    it('Should start the chain-events consumer', async () => {})
    it('Should consume chain events', async () => {})
    it('Should consume identity events', async () => {})
  })
})
