import TokenBalanceCache from 'token-balance-cache/src/index';
import { AddressInstance } from 'server/models/address';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';

enum BulkBalancesErrors {
  NoUserId = 'No userId provided',
  NoUser = "User doesn't exist",
  NoRegisteredAddresses = 'No wallet addresses registered to this user',
  TokenContractNotDeployed = 'Token contract not deployed on specified chain node', // Currently not used, see point 3
}

// ----------- OUTSTANDING QUESTIONS -----------
// 1. Max across addresses or sum across addresses?
// 2. Return a BN or just a number? And how to handle decimals?
// 3. Duplicate wallet addresses, registered to different chains? Currently removing duplicates
// 4. Handling token addresses not deployed on a Chain Node? Currently just ignoring them and still returning a success
// 5. How is this route being authenticated, if at all?
// 6. We are defaulting to ERC20, but do we need to support other token standards?

type bulkBalanceReq = {
  userId: string;
  [key: string]: string | string[];
};

type bulkBalanceResp = {
  [nodeId: string]: {
    [tokenAddress: string]: number;
  };
};

const bulkBalances = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<bulkBalanceReq>,
  res: TypedResponse<bulkBalanceResp>
) => {
  const { userId } = req.body;
  if (!userId) throw new AppError(BulkBalancesErrors.NoUserId);

  const user = await models.User.findOne({ where: { id: userId } });
  if (!user) throw new ServerError(BulkBalancesErrors.NoUser);

  // Get all addresses registered with user
  const addressInstances: AddressInstance[] = await models.Address.findAll({
    where: { user_id: userId },
  });

  // Remove duplicates from addresses
  const userWalletAddresses: string[] = [
    ...new Set(addressInstances.map((addressObj) => addressObj.address)),
  ];

  if (userWalletAddresses.length === 0) {
    throw new AppError(BulkBalancesErrors.NoRegisteredAddresses);
  }

  const balances: bulkBalanceResp = {};

  // Iterate through chain nodes
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

    // Build token balances for each address
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

  return success(res, balances);
};

export default bulkBalances;
