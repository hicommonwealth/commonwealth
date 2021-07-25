import chai from 'chai';
import path from 'path';
const { assert } = chai;
import { spawn } from 'child_process';
import _ from 'underscore';
import { Pool } from 'pg';
import format from 'pg-format';
import { chainSupportedBy, SubstrateTypes } from '@commonwealth/chain-events';


// TODO populate this with the number of identities we are populating in the identity cache for each chain
const numIdentityCache = {
  polkadot: 1,
  edgeware: 1,
  kusama: 1,
  hydradx: 1,

}

const identityQueries = [
  `INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic) 
VALUES ('1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg', 'polkadot', '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT);`,
    `INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic)
VALUES ('hwR8hAatmmdupBLXQSxLUPBa8GhRomLD9hf6iRtFeXs8fcY', 'edgeware', '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT);`,
  `INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic)
VALUES ('J9nD3s7zssCX7bion1xctAF6xcVexcpy2uwy4jTm9JL8yuK', 'kusama', '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT);`,
  `INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic)
VALUES ('HqdGVRB4MXz1osLR77mfWoo536cWasTYsuAbVuicHdiKQXf', 'hydradx', '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT);`,
  `INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic)
VALUES ('2cRhzxw34v2yB8rdP35wB5vkkJe3f4pCSgCbzRmapzv7hWK9', 'kulupu', '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT);`,
]

const fetchedIdentities = {
  polkadot: {
    address: '1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg',
    identity: "Patract",
    judgements: {"1Reg2TYv9rGfrQKpPREmrHRxrNsUDBQKzkYwP1UstD97wpJ": "reasonable", "12j3Cz8qskCGJxmSJpVL2z2t3Fpmw3KoBaBaRGPnuibFc7o8": "fee-paid"},
    data: null
  },
  edgeware: {
    address: 'hwR8hAatmmdupBLXQSxLUPBa8GhRomLD9hf6iRtFeXs8fcY',
    identity: "Drew"
  },
  kusama: {
    address: 'J9nD3s7zssCX7bion1xctAF6xcVexcpy2uwy4jTm9JL8yuK',
    identity: 'Jaco'
  },
  hydradx: {
    address: 'HqdGVRB4MXz1osLR77mfWoo536cWasTYsuAbVuicHdiKQXf',
    identity: 'GalacticCouncil'
  },
  kulupu: {
    address: '2cRhzxw34v2yB8rdP35wB5vkkJe3f4pCSgCbzRmapzv7hWK9',
    identity: 'sgaragagghu'
  }

}

async function populateIdentityCache(pool): Promise<void> {
  for (const query of identityQueries) {
    try {
      await pool.query(query)
    } catch (error) {
      if (String(error).includes('duplicate key')) continue;
      console.log(`Error executing the following query: ${query}`)
      throw error
    }
  }
}

async function verifyIdentityChanges(pool, chain: string): Promise<boolean> {
  let query = format(`SELECT "id", "address" FROM "Addresses" WHERE "address"=%L`,
    fetchedIdentities[chain].address);
  const id = (await pool.query(query)).rows[0].id;

  query = format(`SELECT "identity" FROM "OffchainProfiles" WHERE "address_id"=%L`, id);
  const identity = (await pool.query(query)).rows[0].address_id;

  return identity == fetchedIdentities[chain].identity;
}

function delay(interval) {
  return it('delaying...', (done) => {
    setTimeout(() => done(), interval);
  }).timeout(interval + 100);
}

async function getChains(pool): Promise<[{id: string, url: string, substrate_spec: string}]> {
  const query = `SELECT "Chains"."id", "substrate_spec", "url" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`;
  return (await pool.query(query)).rows
}

const listenerUrls = {
  polkadot: 'wss://rpc.polkadot.io',
  edgeware: 'ws://mainnet1.edgewa.re:9944',
  kusama: 'wss://kusama-rpc.polkadot.io',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  kulupu: 'wss://rpc.kulupu.corepaper.org/ws',
  clover: 'ws://api.clover.finance',
  stafi: 'wss://scan-rpc.stafi.io/ws',
  near: 'https://rpc.nearprotocol.com',
  moloch: 'wss://mainnet.infura.io/ws',
  plasm: 'wss://rpc.plasmnet.io/ws',
  crust: 'wss://api.crust.network/',
  darwinia: 'wss://cc1.darwinia.network/ws',
  phala: 'wss://poc3.phala.com/ws',
  centrifuge: 'wss://fullnode.centrifuge.io',
  marlin: 'wss://mainnet.infura.io/ws',
  'alex-ropsten': 'wss://ropsten.infura.io/ws'
}

// list all the listeners we want to test and their associated settings
// the settings here should be the same as those used in production
const listenerOptions = {
  polkadot: {
    archival: false,
    startBlock: 0,
    url: listenerUrls['polkadot'],
    spec: {"types": {"Address": "MultiAddress", "ChainId": "u8", "Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128", "VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type": "VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"}, "VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]}, "TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum": ["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]", "VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals", "outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo": "AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>", "VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>", "DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes", "ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber", "votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord": {"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId", "vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus": {"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 1_000 }
  },
  edgeware: {
    archival: false,
    startBlock: 0,
    url: listenerUrls['edgeware'],
    spec: null,
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 1_000 }
  },
  kusama: {
    archival: false,
    startBlock: 0,
    url: listenerUrls['kusama'],
    spec: null,
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 1_000 }
  },
  kulupu: {
    archival: false,
    startBlock: 0,
    url: listenerUrls['kulupu'],
    spec: {"typesBundle": {"spec": {"kulupu": {"types": [{"types": {"Era": {"finalBlockHash": "H256", "finalStateRoot": "H256", "genesisBlockHash": "H256"}, "CurvePoint": {"start": "BlockNumber", "reward": "Balance", "taxation": "Perbill"}, "Difficulty": "U256", "DifficultyAndTimestamp": {"timestamp": "Moment", "difficulty": "Difficulty"}}, "minmax": [0, null]}, {"types": {"Address": "MultiAddress", "LookupSource": "MultiAddress"}, "minmax": [13, null]}, {"types": {"CampaignIdentifier": "[u8; 4]"}, "minmax": [17, null]}]}}}},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 1_000 }
  },
  hydradx: {
    archival: false,
    startBlock: 0,
    url: listenerUrls['hydradx'],
    spec: null,
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 1_000 },
  },
  moloch: {
    url: listenerUrls['moloch'],
    skipCatchup: false,
    contractAddress: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
    contractVersion: 2
  },
  marlin: {
    url: listenerUrls['marlin'],
    skipCatchup: false,
    contractAddresses: {
      comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
      governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
      timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
    }
  }
}



function verifyListener(chains: string[], listeners: any) {
  for (const chain of chains) {
    // if (!_.isEqual(listenerOptions[chain], listeners[chain].options)) return false
    assert.deepEqual(listenerOptions[chain], listeners[chain])
  }
  return true;
}

const supportedChains = ['polkadot', 'kusama', 'edgeware', 'kulupu', 'hydradx', 'moloch', 'marlin']

// LOOP through all the chains individually to test functionality for all chains
setTimeout(async () => {
  let pool;
  let chains: [{id: string, url: string, substrate_spec: string}];

  pool = new Pool({
    connectionString: 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    assert.fail()
  });

  chains = await getChains(pool)

  describe.only('Tests for starting chain-event nodes', () => {
    after(() => {
      pool.end()
    })

    // TODO: figure out a good method of testing if events are actually produced
    describe.only('Tests for single chain per node', () => {
      let child, consumer;
      chains.forEach((chain, chainIndex) => {
        if (!supportedChains.includes(chain.id)) return;
        describe.only(`Tests for a ${chain.id} chain-events node`, () => {
          it.only('Should start a node with the correct listener', (done) => {
            populateIdentityCache(pool).then(() => {
              child = spawn(`ts-node`,
                [`${__dirname}../../../server/scripts/dbNode.ts`],
                {env: { ...process.env, TESTING:'true', WORKER_NUMBER:String(chainIndex), NUM_WORKERS:'29', HANDLE_IDENTITY:'publish'}}
              );
              child.on('error', (error) => {
                console.log(error)
                assert.fail()
              })

              console.log(`\n${chain.id}:`)
              child.stdout.on('data', (data) => {
                data = String(data)
                console.log(`${data}`);
                if (data.includes('Listener Validation')) {
                 let listeners = JSON.parse(data.substring(data.indexOf(':') + 1))
                  verifyListener([chain.id], listeners)
                  done()
                }
              });

              child.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
                if (!data.includes('Unable to determine offline time range')) {
                  assert.fail()
                }
              });
            })
          }).timeout(30000)

          // only substrate chains use the identity cache
          if (chainSupportedBy(chain.id, SubstrateTypes.EventChains) && chain.id != 'stafi' && chain.id != 'clover') {
            // check publish functionality
            it('Should publish identity events and clear the identity cache', async () => {
              // check identity cache is empty
              const query = format(`SELECT * FROM "IdentityCaches" WHERE "chain"=%L;`, chain)
              assert((await pool.query(query)).rows.length == 0)

              // check the proper number of messages have been queued in the identity queue
              const res = await fetch('http://guest:guest@127.0.0.1:15672/api/queues/');
              const data = await res.json();
              const identityQueue = data.filter((obj) => obj.name == 'identityQueue')
              assert.equal(identityQueue.messages, numIdentityCache[chain.id]);

              return;
            })

            // check handle functionality
            it.skip('Should handle identity events and clear the identity cache', async () => {
              // check identity cache is empty
              const query = format(`SELECT * FROM "IdentityCaches" WHERE "chain"=%L;`, chain)
              assert((await pool.query(query)).rows.length == 0)

              // check that no identity events are queued in the identity queue
              const res = await fetch('http://guest:guest@127.0.0.1:15672/api/queues/');
              const data = await res.json();
              const identityQueue = data.filter((obj) => obj.name == 'identityQueue')
              assert.equal(identityQueue.messages, 0);

              assert.isTrue(await verifyIdentityChanges(pool, chain.id));

              return;
            })
          }
        })

        describe('Tests for the chain-events consumer', () => {
          it('Should start the chain-events consumer', async () => {
            consumer = spawn('ts-node',
              ['--project ../../server/scripts/tsconfig.consumer.json', '../../server/scripts/setupChainEventListeners.ts'],
              {env: { ...process.env, TESTING:'true'}}
            )
            consumer.on('error', assert.fail)
            consumer.on('message', (data) => {
              assert.equal(data, 'consumer started')
            })
            return;
          })

          // only substrate chains use the identity cache
          if (chainSupportedBy(chain.id, SubstrateTypes.EventChains) && chain.id != 'stafi' && chain.id != 'clover') {
            it('Should delay to give consumer time to process identity events', (done) => {
              delay(5000);
              done();
            })

            it('Should consume identity events', async () => {
              assert.isTrue(await verifyIdentityChanges(pool, chain.id))
              // stop this chain-events node
              child.kill()
              return;
            })
          }
        })
      })
    })

    describe('Tests for multiple chains per node', () => {

    })
  })

  run()
}, 5000)

