import type { Request } from 'express';

const oneBlock = 6; // typical Cosmos block time is ~6 seconds
const defaultCacheDuration = null; // do not cache unless specified

export function calcCosmosRPCCacheKeyDuration(req, res, next) {
  const body = parseReqBody(req);

  // cosmosRPCDuration and cosmosRPCKey are defined below
  // TX Response: do not cache and call next()
  req.cacheDuration = cosmosRPCDuration(body);
  if (!req.cacheDuration) return next();
  req.cacheKey = cosmosRPCKey(req, body);

  return next();
}

export function cosmosLCDDuration(req) {
  // Matches ProposalStatus from libs/chains/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov.ts
  const activeProposalCodes = [1, 2]; // ['DepositPeriod', 'VotingPeriod']
  const completedProposalCodes = [3, 4, 5]; // ['Passed', 'Rejected', 'Failed']
  const url = req.url;
  const proposalStatus = req?.query?.proposal_status;
  let duration = defaultCacheDuration;

  if (proposalStatus) {
    if (activeProposalCodes.some((c) => c === +proposalStatus)) {
      // ACTIVE PROPOSALS: 10 seconds cache
      duration = 10;
    } else if (completedProposalCodes.some((c) => c === +proposalStatus)) {
      // COMPLETED PROPOSALS: cache 30 seconds
      duration = 30;
    }
  } else if (/\/proposals\/\d+\/(votes|tally|deposits)/.test(url)) {
    // live proposal voting data: cache 6 seconds
    duration = oneBlock;
  } else if (/\/proposals\/(\d+)$/.test(url)) {
    // specific proposal request: long-term cache (1 week)
    duration = 60 * 60 * 24 * 7;
  } else if (url?.includes('/params/')) {
    // PARAMS: cache long term (5 days)
    duration = 60 * 60 * 24 * 5;
  }
  return duration;
}

export function calcCosmosLCDCacheKeyDuration(req, res, next) {
  if (/BROADCAST/.test(req.body?.mode)) return next(); // TX broadcast: do not cache
  if (/\/cosmos\/tx\/v1beta1/.test(req.url)) return next(); // TX request: do not cache
  const duration = cosmosLCDDuration(req);
  req.cacheDuration = duration;
  req.cacheKey = req.originalUrl;
  return next();
}

export const cosmosRPCDuration = (body) => {
  let duration = defaultCacheDuration;

  if (/^(tx)/.test(body?.method)) {
    // TX Response: do not cache
    return null;
  } else if (/(block|status)/.test(body?.method)) {
    // BLOCK CHECK: short cache
    duration = oneBlock;
  } else if (/Query\/(Proposal)$/.test(body?.params?.path)) {
    // Individual Proposal: cache long-term (1 week)
    duration = 60 * 60 * 24 * 7;
  } else if (/Query\/(Votes|TallyResult|Deposits)/.test(body?.params?.path)) {
    // LIVE DATA: 6 seconds
    duration = oneBlock;
  } else if (/Query\/(Params|Pool)/.test(body?.params?.path)) {
    // chain PARAMS: cache long-term (5 days)
    duration = 60 * 60 * 24 * 5;
  } else if (/(0801|0802)/.test(body?.params?.data)) {
    // ACTIVE PROPOSALS: 10 seconds
    // RPC specific codes from cosmJS requests:
    // 0801 = 'DepositPeriod', 0802 = 'VotingPeriod'
    duration = 10;
  } else if (/(0803|0804|0805)/.test(body?.params?.data)) {
    // COMPLETED PROPOSALS: 30 seconds
    // 0803 = 'Passed', 0804 = 'Rejected', 0805 = 'Failed'
    duration = 30;
  }
  return duration;
};

export const cosmosRPCKey = (req, body) => {
  const params = body?.params;
  let identifier = JSON.stringify(params);

  if (/Query\/(Params|Pool)/.test(params?.path) && params?.data === '') {
    // chain PARAMS: need to leave off ID to cache long-term
    identifier = params.path;
  }

  if (!identifier || identifier === '{}') {
    identifier = JSON.stringify(body);
  }

  return `${req.originalUrl}_${identifier}`;
};

const parseReqBody = (req: Request) => {
  let body = req.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(req.body);
    } catch (err) {
      console.log('Error parsing body: ', err);
    }
  }

  return body;
};
