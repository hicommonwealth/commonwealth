import fs from 'fs';
import path from 'path';
import _ from 'lodash';

export const MAINNET_LOCKDROP = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
export const ROPSTEN_LOCKDROP = '0x111ee804560787E0bFC1898ed79DAe24F2457a04';
const MAINNET_START_BLOCK = 8060000;
const MAX_BLOCKS_PER_MAINNET_QUERY = 10000;
const DEV_INFURA_TOKEN = '4141b5f218a74641bdddca3bfe031d6b';

//
// ethereum
//

const getInfuraWeb3Provider = async (network = 'mainnet') => {
  const Web3 = (await import('web3')).default;
  const provider = new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${DEV_INFURA_TOKEN}`);
  const web3 = new Web3(provider);
  return web3;
};

// fetch events given a contract object, event name, and block range
const fetchEvents = async (web3, originContract, eventName, fromBlock, blocksPerQuery) => {
  const initialFromBlock = fromBlock;
  const latestBlock = await web3.eth.getBlockNumber();
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

export const updateEvents = (app, models): Promise<number> => {
  return new Promise((resolve) => {
    fs.readFile(path.join(__dirname, 'etc/Lockdrop.json'), async (error, data) => {
      if (error) {
        console.log('Error:', error);
        resolve(1);
        return;
      }
      try {
        const web3 = await getInfuraWeb3Provider();
        const json = JSON.parse(data.toString());
        const contract = new web3.eth.Contract(json.abi, MAINNET_LOCKDROP);

        // get starting block to scan from
        const lastSignalEvent = await models.EdgewareLockdropEvent.findOne({
          where: {
            origin: models.sequelize.where(models.sequelize.fn('LOWER', models.sequelize.col('origin')),
                                          'LIKE', `%${MAINNET_LOCKDROP}%`),
            name: 'Signaled',
          },
          order: [['blocknum', 'DESC']]
        });
        const lastLockEvent = await models.EdgewareLockdropEvent.findOne({
          where: {
            origin: models.sequelize.where(models.sequelize.fn('LOWER', models.sequelize.col('origin')),
                                          'LIKE', `%${MAINNET_LOCKDROP}%`),
            name: 'Locked',
          },
          order: [['blocknum', 'DESC']]
        });
        const lastSignalBlock = lastSignalEvent ? lastSignalEvent.blocknum : MAINNET_START_BLOCK;
        const lastLockBlock = lastLockEvent ? lastLockEvent.blocknum : MAINNET_START_BLOCK;

        // get events
        const events = await Promise.all([
          fetchEvents(web3, contract, 'Signaled', lastSignalBlock, MAX_BLOCKS_PER_MAINNET_QUERY),
          fetchEvents(web3, contract, 'Locked', lastLockBlock, MAX_BLOCKS_PER_MAINNET_QUERY),
        ]);
        const signalEvents = events[0];
        const lockEvents = events[1];

        // save events
        const eventsForCreation = [].concat.apply([], events).map((event) => ({
          //chain: 'ethereum',
          origin: event.address,
          blocknum: event.blockNumber,
          name: event.event,
          data: JSON.stringify(event.returnValues),
        }));
        const eventsCreated = await models.EdgewareLockdropEvent.bulkCreate(eventsForCreation, { validate: true });
        console.log(`Added ${eventsCreated.length} events`);

        // remove duplicate events
        await models.sequelize.query(
          'delete from "EdgewareLockdropEvents" where id in ' +
            '(SELECT min(id) FROM "EdgewareLockdropEvents" GROUP BY origin, blocknum, data HAVING count(*) > 1)'
        );

        // build lookup table of {signaling addresses => blocknum} for getting balances
        const addresses = {};
        signalEvents.map((event) => {
          const contractAddr = event.returnValues.contractAddr;
          if (contractAddr in addresses) {
            addresses[contractAddr] = addresses[contractAddr] > event.blockNumber ?
              addresses[contractAddr] : event.blockNumber;
          } else {
            addresses[contractAddr] = event.blockNumber;
          }
        });
        const addrKeys = Object.keys(addresses);

        // get balances
        console.log(`Getting balances for ${addrKeys.length} new addresses...`);
        const balances = await Promise.all(
          addrKeys.map(async (addr) => {
            const balance = await web3.eth.getBalance(addr, addresses[addr]);
            return balance;
          })
        );

        // save balances
        const balancesForCreation = addrKeys.map((addr, index) => ({
          address: addr,
          balance: balances[index],
          blocknum: addresses[addr],
        }));
        const balancesCreated = await models.EdgewareLockdropBalance.bulkCreate(balancesForCreation, { validate: true });
        console.log(`Saved ${balancesCreated.length} new balances`);

        // done!
        resolve(0);
      } catch (e) {
        console.log('Error:', e);
        resolve(1);
      }
    });
  });
};

export const updateBalances = async (app, models, blocknum = 8461046): Promise<number> => {
  const web3 = await getInfuraWeb3Provider();
  const entries = await models.EdgewareLockdropBalance.findAll();
  console.log(`Checking ${entries.length} balances...`);
  for (const entry of entries) {
    const balance = await web3.eth.getBalance(entry.address, blocknum);
    if (entry.blocknum.toString() === blocknum.toString()) continue;
    if (entry.balance === balance) {
      console.log('Unchanged', entry.address, ':', entry.balance, '->', balance);
      entry.blocknum = blocknum;
      await entry.save();
    } else {
      entry.blocknum = blocknum;
      entry.balance = balance;
      await entry.save();
      console.log('Updated', entry.address, ':', entry.balance, '->', balance);
    }
  }
  return 0;
};

export default updateEvents;
