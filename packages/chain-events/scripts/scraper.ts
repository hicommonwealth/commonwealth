import fs from 'fs';
import {
  createApi,
  ParseType,
  Subscriber,
} from 'chain-events/src/chain-bases/substrate';
import { EventKind } from 'chain-events/src/chain-bases/substrate/types';

const args = process.argv.slice(2);
const chain = args[0] || 'edgeware';
console.log(`Listening to events on ${chain}.`);

const networks = {
  edgeware: 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
};

const url = networks[chain];

if (!url) throw new Error(`no url for chain ${chain}`);
createApi(url, {}).then(async (api) => {
  const subscriber = new Subscriber(api);
  const identities = {};
  const FINISH_BLOCK = 1000000;
  subscriber.subscribe(async (block) => {
    // go through events and add new identities
    for (const { event } of block.events) {
      const kind = ParseType(
        block.versionName,
        block.versionNumber,
        event.section,
        event.method
      );
      if (kind === EventKind.IdentitySet) {
        // query the entire identity data
        const who = event.data[0].toString();
        const registrationOpt = await api.query.identity.identityOf(who);

        // if the identity data exists, populate the object
        if (registrationOpt.isSome) {
          const { info } = registrationOpt.unwrap();
          identities[who] = info;
        }
      }
      if (
        kind === EventKind.IdentityCleared ||
        kind === EventKind.IdentityKilled
      ) {
        // clear deleted identities from our scaped object
        const who = event.data[0].toString();
        if (identities[who]) {
          delete identities[who];
        }
      }
    }

    // check for completion
    if (+block.header.number >= FINISH_BLOCK) {
      subscriber.unsubscribe();

      // write identities out to file and exit
      fs.writeFileSync(
        './identities.json',
        JSON.stringify(identities, null, 2)
      );
      await api.disconnect();
      process.exit(0);
    }
  });
});
