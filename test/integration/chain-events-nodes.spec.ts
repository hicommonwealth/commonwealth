import chai from 'chai';
import { spawn, ChildProcess } from 'child_process';
import { Pool, Client } from 'pg';
import format from 'pg-format';
import fetch from 'node-fetch'

const { assert } = chai;

// only chains in this array will be tested (can be augmented to pull all chains in db)
const supportedChains = ['polkadot']

// fetched identity should match the identities in this object
const fetchedIdentities = {
  polkadot: {
    address: '1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg',
    identity: "Patract",
    judgements: {"1Reg2TYv9rGfrQKpPREmrHRxrNsUDBQKzkYwP1UstD97wpJ": "reasonable", "12j3Cz8qskCGJxmSJpVL2z2t3Fpmw3KoBaBaRGPnuibFc7o8": "fee-paid"},
    data: null
  },
  edgeware: {
    address: 'kc9xgozPze2cvTDgnto1Ad497MJQPKm1eMozr5QsS7A9Uic',
    identity: "Bison Trail 8" //Co.
  },
  kusama: {
    address: 'Etj64GQ5Mzm98HijdnvqjxMyK8xemPtLTpWdnwEiEvFygJa',
    identity: 'Dan Reecer'
  },
  hydradx: {
    address: 'HqdGVRB4MXz1osLR77mfWoo536cWasTYsuAbVuicHdiKQXf',
    identity: 'GalacticCouncil'
  },
  kulupu: {
    address: '2f6TZDnK1sfCwkZkE69Xq6yRxnqbhw8qajwhWSzrv9gkPeTL',
    identity: 'Dan'
  }
}

// list all the listeners we want to test and their associated settings
// the settings here should be the same as those used in production
const listenerOptions = {
  polkadot: {
    archival: false,
    startBlock: 0,
    url: 'wss://rpc.polkadot.io',
    spec: {},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 10_000 }
  },
  edgeware: {
    archival: false,
    startBlock: 0,
    url: 'ws://mainnet2.edgewa.re:9944',
    spec: {"types": {"Address": "MultiAddress", "ChainId": "u8", "Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128", "VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type": "VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"}, "VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]}, "TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum": ["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]", "VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals", "outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo": "AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>", "VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>", "DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes", "ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber", "votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord": {"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId", "vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus": {"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 10_000 }
  },
  kusama: {
    archival: false,
    startBlock: 0,
    url: 'wss://kusama-rpc.polkadot.io',
    spec: {},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 10_000 }
  },
  kulupu: {
    archival: false,
    startBlock: 0,
    url: 'wss://rpc.kulupu.corepaper.org/ws',
    spec: {"typesBundle": {"spec": {"kulupu": {"types": [{"types": {"Era": {"finalBlockHash": "H256", "finalStateRoot": "H256", "genesisBlockHash": "H256"}, "CurvePoint": {"start": "BlockNumber", "reward": "Balance", "taxation": "Perbill"}, "Difficulty": "U256", "DifficultyAndTimestamp": {"timestamp": "Moment", "difficulty": "Difficulty"}}, "minmax": [0, null]}, {"types": {"Address": "MultiAddress", "LookupSource": "MultiAddress"}, "minmax": [13, null]}, {"types": {"CampaignIdentifier": "[u8; 4]"}, "minmax": [17, null]}]}}}},
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 10_000 }
  },
  hydradx: {
    archival: false,
    startBlock: 0,
    url: 'wss://rpc-01.snakenet.hydradx.io',
    spec: null,
    skipCatchup: false,
    enricherConfig: { balanceTransferThresholdPermill: 10_000 },
  },
  moloch: {
    url: 'wss://mainnet.infura.io/ws',
    skipCatchup: false,
    contractAddress: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
    contractVersion: 2
  },
  marlin: {
    url: 'wss://mainnet.infura.io/ws',
    skipCatchup: false,
    contractAddresses: {
      comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
      governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
      timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
    }
  },
  susd: {
    url: "wss://mainnet.infura.io/ws",
    tokenAddresses: ["0x57ab1ec28d129707052df4df418d58a2d46d5f51"]
  }
}

// clears the IdentityCaches, OffchainProfiles, and Addresses tables of the test data
async function clearDB(pool) {
  const addresses = Object.values(fetchedIdentities).map(value => value.address)

  let query;
  try {
    // clear identity cache
    query = format(`DELETE FROM "IdentityCaches" WHERE "address" IN (%L)`, addresses);
    await pool.query(query);

    // clear OffchainProfiles
    query = format(`SELECT "id" FROM "Addresses" WHERE "address" IN (%L)`, addresses)
    const IDs = (await pool.query(query)).rows.map(obj => obj.id);
    query = format(`DELETE FROM "OffchainProfiles" WHERE "address_id" IN (%L)`, IDs);
    await pool.query(query)

    // clear Addresses
    query = format(`DELETE FROM "Addresses" WHERE "address" IN (%L)`, addresses);
    await pool.query(query)
  } catch (error) {
    console.log(query);
    throw error
  }
}

// clears the rabbitmq events and identity queues
async function clearQueues(): Promise<void> {
  let res = await fetch('http://localhost:15672/api/queues/%2F/identityQueue/contents', {
    'method': 'DELETE',
    'headers': {
      'Authorization': 'Basic Z3Vlc3Q6Z3Vlc3Q='
    }
  })
  if (res.status != 204) throw new Error("Could not clear the identity queue")

  res = await fetch('http://localhost:15672/api/queues/%2F/eventsQueue/contents', {
    'method': 'DELETE',
    'headers': {
      'Authorization': 'Basic Z3Vlc3Q6Z3Vlc3Q='
    }
  })
  if (res.status != 204) throw new Error("Could not clear the events queue")
}

// populates the Address, OffchainProfiles, and IdentityCaches tables with test data
async function prepareDB(client): Promise<void> {
  let query
  try {
    for (const [chain, data] of Object.entries(fetchedIdentities)) {
      query = format(`INSERT INTO "Addresses" (address, chain, verification_token, created_at, updated_at, is_councillor, is_validator, is_magic) VALUES (%L, %L, '1', '2020-05-01', '20-05-01', DEFAULT, DEFAULT, DEFAULT)`,
        data.address, chain);
      await client.query(query);

      query = `INSERT INTO "OffchainProfiles" (address_id) VALUES (lastval())`
      await client.query(query);

      query = format(`INSERT INTO "IdentityCaches" (chain, address) VALUES (%L, %L)`, chain, data.address)
      await client.query(query);
    }
  } catch (error) {
    console.log('Error executing:', query);
    throw error;
  }

  return;
}

async function verifyIdentityChanges(pool, chain: string): Promise<boolean> {
  let query = format(`SELECT "id", "address" FROM "Addresses" WHERE "address"=%L`,
    fetchedIdentities[chain].address);
  const id = (await pool.query(query)).rows[0].id;

  query = format(`SELECT "identity" FROM "OffchainProfiles" WHERE "address_id"=%L`, id);
  const identity = (await pool.query(query)).rows[0].identity;

  return identity == fetchedIdentities[chain].identity;
}

async function getChains(pool): Promise<[{id: string, url: string, substrate_spec: string, base: string}]> {
  const query = `SELECT "Chains"."id", "substrate_spec", "url", "base" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`;
  return (await pool.query(query)).rows
}

function verifyListener(chains: string[], listeners: any) {
  for (const chain of chains) {
    // if (!_.isEqual(listenerOptions[chain], listeners[chain].options)) return false
    assert.deepEqual(listeners[chain], listenerOptions[chain])
  }
  return true;
}

// the following code ensures that child processes are terminated before the main process exits due to any reason
function childExit(children: ChildProcess[]) {
  process.stdin.resume()
  function exitHandler() {
    console.log("Ending child processes")
    for (let child of children) {
      if (child) {
        child.kill();
        child = null;
      }
    }
    console.log("All child processes closed")
  }
//do something when app is closing
  process.on('exit', exitHandler);
//catches ctrl+c event
  process.on('SIGINT', exitHandler);
// catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler);
  process.on('SIGUSR2', exitHandler);
//catches uncaught exceptions
  process.on('uncaughtException', exitHandler);
}

// a drop in test case to delay further test cases (used to wait for events) - only use when absolutely necessary (latency reasons)
function delay(interval) {
  return it.only('delaying...', (done) => {
    setTimeout(() => done(), interval);
  }).timeout(interval + 100);
}

setTimeout(async () => {
  let chains: [{id: string, url: string, substrate_spec: string, base: string}];

  const pool = new Pool({
    connectionString: 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  });
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    assert.fail()
  });

  const client = new Client({
    connectionString: 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  })
  await client.connect()

  chains = await getChains(pool);
  await clearDB(pool);
  await clearQueues();
  await prepareDB(client);

  // TODO: figure out a good method of testing if events are actually produced => set reconnectRange to some known block with
  // TODO: a certain amount of events then check if those events were added to the databases in ChainEvents
  describe.only('Tests for single chain per node', () => {
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      assert.fail();
    });

    chains.forEach((chain, chainIndex) => {
      if (!supportedChains.includes(chain.id)) return;
      describe.only(`Tests for a ${chain.id} chain-events node`, () => {
        it.only(`Should start a node with a ${chain.id} listener`, (done) => {
          let child = spawn(`ts-node`,
            [`${__dirname}../../../server/scripts/dbNode.ts`],
            {env: { ...process.env, TESTING:'true', WORKER_NUMBER:String(chainIndex), NUM_WORKERS:String(chains.length - 1), HANDLE_IDENTITY:'publish', INFURA_API_KEY: '8e25780c4d574b3cbf53c306a841d09f'}}
          );

          childExit([child]);

          child.on('error', (error) => {
            console.log(error)
            assert.fail(String(error))
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
              assert.fail(String(data))
            }
          });
        }).timeout(30000)

        // only substrate chains use the identity cache
        if (chain.base == 'substrate' && chain.id != 'stafi' && chain.id != 'clover') {
          // check publish functionality
          it.only('Should clear the identity cache', async () => {
            // check identity cache is empty
            const query = `SELECT * FROM "IdentityCaches" WHERE "chain"='polkadot';`
            assert((await pool.query(query)).rows.length == 0)
          })

          // delay briefly due to message latency
          delay(10000);

          it.only('Should publish a message to the identity queue', async () => {
            // check the proper number of messages have been queued in the identity queue
            const res = await fetch('http://127.0.0.1:15672/api/queues/', {
              method: 'GET',
              headers: {
                'Authorization': 'Basic Z3Vlc3Q6Z3Vlc3Q='
              }
            });
            const data = await res.json();
            const identityQueue = data.filter((obj) => obj.name == 'identityQueue')[0]
            assert.equal(identityQueue.messages, 1);
            return;
          })

          // check handle functionality
          it.skip('Should handle identity events and clear the identity cache', async () => {
            // check identity cache is empty
            const query = format(`SELECT * FROM "IdentityCaches" WHERE "chain"=%L;`, chain)
            assert((await pool.query(query)).rows.length == 0)

            // check that no identity events are queued in the identity queue
            const res = await fetch('http://127.0.0.1:15672/api/queues/', {
              method: 'GET',
              headers: {
                'Authorization': 'Basic Z3Vlc3Q6Z3Vlc3Q='
              }
            })
            const data = await res.json();
            const identityQueue = data.filter((obj) => obj.name == 'identityQueue')
            assert.equal(identityQueue.messages, 0);

            assert.isTrue(await verifyIdentityChanges(pool, chain.id));

            return;
          })
        }
      })

      describe.only('Tests for the chain-events consumer', () => {
        it.only('Should start the chain-events consumer',(done) => {
          let consumer;
          consumer = spawn('ts-node',
            [`${__dirname}../../../server/scripts/setupChainEventListeners`],
            {env: { ...process.env, HANDLE_IDENTITY:'publish'}}
          )

          childExit([consumer]);

          consumer.on('error', (error) => {
            console.log(error)
            assert.fail()
          })

          console.log(`\n${chain.id}:`)
          consumer.stdout.on('data', (data) => {
            data = String(data)
            console.log(`${data}`);
            if (data.includes('consumer started')) {
              done()
            }
          });

          consumer.stderr.on('data', (data) => {
            console.error(`child stderr:\n${data}`);
            assert.fail();
          });
        }).timeout(30000);

        // only substrate chains use the identity cache
        if (chain.base === 'substrate' && chain.id != 'stafi' && chain.id != 'clover') {
          delay(10000)

          it.only('Should consume identity events', async () => {
            assert.isTrue(await verifyIdentityChanges(pool, chain.id))

            // makre sure identity queue is empty
            const res = await fetch('http://127.0.0.1:15672/api/queues/', {
              method: 'GET',
              headers: {
                'Authorization': 'Basic Z3Vlc3Q6Z3Vlc3Q='
              }
            })
            const data = await res.json();
            const identityQueue = data.filter(obj => obj.name == 'identityQueue')[0]
            assert.equal(identityQueue.messages, 0);

            return;
          })
        }
      })
    })
  })
  run()
}, 5000)

