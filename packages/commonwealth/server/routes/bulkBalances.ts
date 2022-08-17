import TokenBalanceCache from 'token-balance-cache/src/index';
import { AddressInstance } from 'server/models/address';

import { DB } from '../database';
import { AppError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';

// A field titled "userId" MUST be passed in the body of the request.
// The other fields are strings
type bulkBalanceReq = {
  userId: string;
  [key: string]: string | string[];
};

type bulkBalanceResp = {
  [nodeId: string]: {
    [tokenAddress: string]: number;
  };
};

// TODO: Handle errors and how to expose this route

const bulkBalances = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<bulkBalanceReq>,
  res: TypedResponse<bulkBalanceResp>
) => {
  const { userId } = req.body;

  // Get all addresses from user
  const addressInstances: AddressInstance[] = await models.Address.findAll({
    where: { user_id: userId },
  });

  // TODO: Should we remove duplicates that occur when a user has the same address
  // registered to different chains? probably right?
  const userWalletAddresses: string[] = addressInstances.map(
    (addressObj) => addressObj.address
  );

  const balances: bulkBalanceResp = {};

  for (const key of Object.keys(req.body)) {
    // eslint-disable-next-line no-continue
    if (key === 'userId') continue;

    const nodeId = parseInt(key.slice(0, key.length - 2), 10);
    let tokenAddresses = req.body[key];

    // Handle when only one value in array
    if (typeof tokenAddresses === 'string') {
      tokenAddresses = [tokenAddresses];
    }

    const tokenBalances: { [tokenAddress: string]: number } = {};

    for (const tokenAddress of tokenAddresses) {
      let balanceTotal = 0;
      for (const userWalletAddress of userWalletAddresses) {
        try {
          const balance = await tokenBalanceCache.getBalance(
            nodeId,
            userWalletAddress,
            tokenAddress,
            'erc20'
          );
          balanceTotal += balance.toNumber();
        } catch (e) {
          console.log(e);
        }
      }
      tokenBalances[tokenAddress] = balanceTotal;
    }

    balances[nodeId] = tokenBalances;
  }

  console.log('Balances: ', balances);

  return success(res, balances);
};

export default bulkBalances;
