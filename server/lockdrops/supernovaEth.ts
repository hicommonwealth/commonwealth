import fs from 'fs';
import path from 'path';
import _ from 'lodash';

export const MAINNET_LOCKDROP = 'TO_BE_DECIDED';
export const ROPSTEN_LOCKDROP = 'TO_BE_DECIDED';
export const LOCAL_LOCKDROP = '0x148B934429b9ae5c61870759917bb5348f141618';
let START_BLOCK;
const MAX_BLOCKS_PER_MAINNET_QUERY = 10000;
const DEV_INFURA_TOKEN = '4141b5f218a74641bdddca3bfe031d6b';

//
// ethereum
//

const getLockdrop = (network) => {
  if (network === 'local') {
    START_BLOCK = 0;
    return LOCAL_LOCKDROP;
  } else if (network === 'ropsten') {
    START_BLOCK = 100000000000;
    return ROPSTEN_LOCKDROP;
  } else {
    START_BLOCK = 100000000000;
    return MAINNET_LOCKDROP;
  }
};

const getInfuraWeb3Provider = async (network = 'mainnet') => {
  let url;
  if (network === 'local') {
    url = 'http://localhost:8545';
  } else {
    url = `https://${network}.infura.io/v3/${DEV_INFURA_TOKEN}`;
  }
  const Web3 = (await import('web3')).default;
  const provider = new Web3.providers.HttpProvider(url);
  const web3 = new Web3(provider);
  return web3;
};

// fetch events given a contract object, event name, and block range
const fetchEvents = async (web3, originContract, eventName, fromBlock, blocksPerQuery) => {
  const initialFromBlock = fromBlock;
  const latestBlock = await web3.eth.getBlockNumber();
  console.log(latestBlock);
  let events = [];
  let toBlock = fromBlock + blocksPerQuery;
  console.log(`Getting ${eventName} events...`);
  while (toBlock < latestBlock + blocksPerQuery) {
    const newEvents = await originContract.getPastEvents(eventName, { fromBlock: fromBlock, toBlock: toBlock, });
    events = events.concat(newEvents);
    fromBlock += blocksPerQuery;
    toBlock += blocksPerQuery;
    console.log(`Found ${newEvents.length} ${eventName} events (${fromBlock}-${toBlock})`);
  }
  console.log(`Fetched total of ${events.length} ${eventName} events`);
  return events;
};

export const updateEvents = (models, network) => {
  fs.readFile(path.join(__dirname, '../etc/SupernovaLockdrop.json'), async (error, data) => {
    try {
      const web3 = await getInfuraWeb3Provider(network);
      console.log(`Updating events with contract ${getLockdrop(network)}`);
      const json = JSON.parse(data.toString());
      const contract = new web3.eth.Contract(json.abi, getLockdrop(network));

      const lastLockEvent = await models.SupernovaLockdropETHLock.findOne({
        where: {
          address: models.sequelize.where(models.sequelize.fn('LOWER', models.sequelize.col('address')),
                                         'LIKE', `%${MAINNET_LOCKDROP}%`),
        },
        order: [['blocknum', 'DESC']]
      });
      const lastLockBlock = lastLockEvent ? lastLockEvent.blocknum : START_BLOCK;
      // get events
      const lockEvents = await fetchEvents(web3, contract, 'Locked', lastLockBlock, MAX_BLOCKS_PER_MAINNET_QUERY);
      // save events
      const eventsForCreation = lockEvents.map((event) => ({
        chainType: 'ethereum',
        address: event.returnValues.owner,
        blocknum: event.blockNumber,
        balance: event.returnValues.eth,
        timestamp: new Date(Number(event.returnValues.time) * 1000),
        data: JSON.stringify(event),
      }));
      const eventsCreated = await models.SupernovaLockdropETHLock.bulkCreate(eventsForCreation, { validate: true });
      console.log(`Added ${eventsCreated.length} events`);

      // remove duplicate events
      await models.sequelize.query(
        'delete from "SupernovaLockdropETHLocks" where id in ' +
          '(SELECT min(id) FROM "SupernovaLockdropETHLocks" GROUP BY address, blocknum, data HAVING count(*) > 1)'
      );
      // done!
      process.exit(0);
    } catch (e) {
      console.log('Error:', e);
      process.exit(1);
    }
  });
};

export default updateEvents;
