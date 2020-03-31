import nodefetch from 'node-fetch';
(global as any).window = {};
(global as any).fetch = nodefetch;
import _ from 'lodash';
import fs from 'fs';
import updateEvents from './supernovaEth';
import CosmosApi from '@lunie/cosmos-api';

export const fetchBTCStats = async (models, path) => {
  const filepath = path || './btcLockData.json';
  const data = fs.readFileSync(path);
  try {
    const locksForCreation = JSON.parse(data.toString());
    if (models) {
      const eventsCreated = await models.SupernovaLockdropBTCLock.bulkCreate(locksForCreation, { validate: true });
      console.log(`BTC: Added ${eventsCreated.length} events`);
    }
  } catch (error) {
    console.log(error);
  }
  fs.unlinkSync(path);
};

export const fetchETHStats = async (models, network) => {
  await updateEvents(models, network);
};

export const fetchATOMStats = async (models, cosmosRestUrl, chainType) => {
  const pollDelegations = async (val, chainType) => {
    const dForValidator = await cosmos.get.validatorDelegations(val.operator_address);
    const formattedData = dForValidator.map((individualDelegation) => {
      return Object.assign({}, individualDelegation, {
        tokens: val.tokenPerShare * Number(individualDelegation.shares)
      });
    });
    // format for storage in database
    return formattedData.map((delegation) => {
      return {
        chainType,
        address: delegation.delegator_address,
        balance: delegation.tokens,
        blocknum: height,
        timestamp: new Date(time),
        data: JSON.stringify({ validator: val }),
      };
    });
  };

  const cosmos = new CosmosApi(cosmosRestUrl);
  const block = await cosmos.get.latestBlock();
  const height = block.block_meta.header.height;
  const time = block.block_meta.header.time;
  // get current set of validators
  const valSetResult = await cosmos.get.validatorSet();
  // create mapping of pubkeys to validator info
  const operatorMap = (await cosmos.get.validators()).map((elt) => {
    return [ elt.consensus_pubkey, elt ];
  }).reduce((curr, prev) => {
    curr[prev[0]] = prev[1];
    return curr;
  }, {});
  // filter for only current validators
  const currentValSetData = valSetResult.validators.filter((val) => {
    return val.pub_key in operatorMap;
  }).map((val) => Object.assign({}, operatorMap[val.pub_key], val, {
    tokenPerShare: Number(operatorMap[val.pub_key].tokens) / Number(operatorMap[val.pub_key].delegator_shares),
  }));
  // get all delegations on current validator set
  const promises = currentValSetData.map(async (val) => {
    try {
      return await pollDelegations(val, chainType);
    } catch (e) {
      // fail gracefully and return the validator for future polling
      return { data: JSON.stringify({ validator: val }) };
    }
  });
  const locksForCreation = _.flatten(await Promise.all(promises));
  if (models) {
    const eventsCreated = await models.SupernovaLockdropATOMLock.bulkCreate(locksForCreation, { validate: true });
    console.log(`ATOM: Added ${eventsCreated.length} events`);
  }
};
export const updateSupernovaStats = async (models, cosmosRestUrl, cosmosChainType) => {
  try {
    console.log('Querying, BTC stats');
    await fetchBTCStats(models, undefined);
  } catch (error) {
    console.log('Error parsing local BTC lock file, ensure you have created it with the lock data');
  }
  try {
    console.log('Querying, ETH stats');
    await fetchETHStats(models, 'local');
  } catch (error) {
    console.log('Error fetching ETH stats, check your node connection');
  }
  try {
    console.log('Querying, ATOM stats');
    await fetchATOMStats(models, cosmosRestUrl, cosmosChainType);
  } catch (error) {
    console.log('Error fetching ATOM stats, check your node connection');
  }
};

export default updateSupernovaStats;
