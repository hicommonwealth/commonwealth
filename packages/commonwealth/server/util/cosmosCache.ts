import type { Request, RequestHandler } from 'express';
import { cacheDecorator } from 'common-common/src/cacheDecorator';

const oneBlock = 6; // typical Cosmos block time is ~6 seconds

export const cosmosCacheRPC = (duration: number): RequestHandler => {
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

  return async function cacheIfCacheworthyRPC(req, res, next) {
    const body = parseReqBody(req);
    const params = JSON.stringify(body?.params);
    const method = body?.method;

    if (/^(tx)/.test(method)) {
      // TX Response: do not cache
      return next();
    } else if (/^(block|status)/.test(method)) {
      // BLOCK CHECK: short cache
      duration = oneBlock;
    } else if (/^Query\/(Votes|TallyResult|Deposits)/.test(params)) {
      // LIVE DATA: short cache
      duration = oneBlock;
    } else if (/^Query\/(Params|Pool)/.test(params)) {
      // chain PARAMS: cache long-term (1 day)
      duration = 60 * 60 * 24;
    } else if (activeCodes.some((c) => c === body?.params?.data)) {
      // ACTIVE PROPOSALS: short cache
      duration = oneBlock;
    } else if (completedCodes.some((c) => c === body?.params?.data)) {
      // COMPLETED PROPOSALS: cache 15 minutes
      duration = 60 * 15;
    }

    return cacheDecorator.cacheMiddleware(duration, cosmosRPCKeyGenerator)(
      req,
      res,
      next
    );
  };
};

export const cosmosCacheLCD = (duration: number): RequestHandler => {
  // Matches ProposalStatus from common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov.ts
  const activeProposalCodes = [1, 2]; // ['DepositPeriod', 'VotingPeriod']
  const completedProposalCodes = [3, 4, 5]; // ['Passed', 'Rejected', 'Failed']

  return async function cacheIfCacheworthyLCD(req, res, next) {
    const url = req.url;
    const proposalStatus = req?.query?.proposal_status;

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
      // LIVE VOTES/TALLY/DEPOSITS: short cache
      duration = oneBlock;
    } else if (url.includes('/params/')) {
      // PARAMS: cache long term (1 day)
      duration = 60 * 60 * 24;
    }

    return cacheDecorator.cacheMiddleware(duration)(req, res, next);
  };
};

const cosmosRPCKeyGenerator = (req: Request) => {
  const body = parseReqBody(req);
  let identifier = JSON.stringify(body?.params);
  if (identifier === '{}') {
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
