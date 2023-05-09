import type { Request } from 'express';

const oneBlock = 6; // typical Cosmos block time is ~6 seconds
const defaultCacheDuration = 60 * 10; // 10 minutes

export function calcCosmosRPCCacheKeyDuration(req, res, next) {
  const body = parseReqBody(req);
  const params = JSON.stringify(body?.params);
  const method = body?.method;

  // cosmosRPCDuration and cosmosRPCKey are defined below
  // TX Response: do not cache and call next()
  req.cacheDuration = cosmosRPCDuration(body, method, params);
  if (req.cacheDuration === null) return next();
  req.cacheKey = cosmosRPCKey(req, body);

  return next();
}

export function calcCosmosLCDCacheKeyDuration(req, res, next) {
  // Matches ProposalStatus from common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov.ts
  const activeProposalCodes = [1, 2]; // ['DepositPeriod', 'VotingPeriod']
  const completedProposalCodes = [3, 4, 5]; // ['Passed', 'Rejected', 'Failed']
  const url = req.url;
  const proposalStatus = req?.query?.proposal_status;
  let duration = defaultCacheDuration;

  if (proposalStatus) {
    if (activeProposalCodes.some((c) => c === +proposalStatus)) {
      // ACTIVE PROPOSALS: short cache
      duration = oneBlock;
    } else if (completedProposalCodes.some((c) => c === +proposalStatus)) {
      // COMPLETED PROPOSALS: cache 15 minutes
      duration = 60 * 15;
    }
    // specific proposal request:
  } else if (url.includes('/proposals/')) {
    // LIVE VOTES/TALLY/DEPOSITS: 5 minutes
    duration = 60 * 5;
  } else if (url.includes('/params/')) {
    // PARAMS: cache long term (1 day)
    duration = 60 * 60 * 24;
  }

  req.cacheDuration = duration;
  req.cacheKey = req.originalUrl;

  return next();
}

const cosmosRPCDuration = (body, method, params) => {
  let duration = defaultCacheDuration;
  // RPC specific codes from cosmJS requests
  const activeCodes = ['0801', '0802']; // ['DepositPerion', 'VotingPeriod']
  const completedCodes = [
    '0803', // 'Passed'
    '0804', // 'Rejected'
    '0805', // 'Failed'
    '0803220a0a080000000000000087', // 'Passed - Osmosis'
    '0803220a0a080000000000000100', // 'Passed - Osmosis'
    '0803220a0a080000000000000189', // 'Passed - Osmosis'
  ];

  if (/^(tx)/.test(method)) {
    // TX Response: do not cache
    return null;
  } else if (/(block|status)/.test(method)) {
    // BLOCK CHECK: short cache
    duration = oneBlock;
  } else if (/Query\/(Votes|TallyResult|Deposits)/.test(params)) {
    // LIVE DATA: 5 minutes
    duration = 60 * 5;
  } else if (/Query\/(Params|Pool)/.test(params)) {
    // chain PARAMS: cache long-term (1 day)
    duration = 60 * 60 * 24;
  } else if (activeCodes.some((c) => c === body?.params?.data)) {
    // ACTIVE PROPOSALS: short cache
    duration = oneBlock;
  } else if (completedCodes.some((c) => c === body?.params?.data)) {
    // COMPLETED PROPOSALS: cache 15 minutes
    duration = 60 * 15;
  }

  return duration;
};

const cosmosRPCKey = (req, body) => {
  const params = body?.params;
  let identifier = JSON.stringify(params);

  if (/Query\/(Params|Pool)/.test(identifier)) {
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
