import TokenBalanceCache from 'token-balance-cache/src/index';
import { AddressInstance } from 'server/models/address';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';

enum BulkBalancesErrors {
  NoProfileId = 'No profileId provided',
  NoProfile = "Profile doesn't exist",
  NoRegisteredAddresses = 'No wallet addresses registered to this profile',
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
  profileId: number;
  chainNodes: {
    [nodeId: number]: string | string[];
  };
};

type bulkBalanceResp = {
  [nodeId: string]:
    | {
        [tokenAddress: string]: number;
      }
    | number;
};

const bulkBalances = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<bulkBalanceReq>,
  res: TypedResponse<bulkBalanceResp>
) => {
  const { profileId, chainNodes } = req.body;
  if (!profileId) throw new AppError(BulkBalancesErrors.NoProfileId);

  const profile = await models.Profile.findOne({ where: { id: profileId } });
  if (!profile) throw new ServerError(BulkBalancesErrors.NoProfile);

  // Get all addresses registered with user
  const addressInstances: AddressInstance[] = await models.Address.findAll({
    where: { profile_id: profileId },
  });

  // Remove duplicates from addresses
  const profileWalletAddresses: string[] = [
    ...new Set(addressInstances.map((addressObj) => addressObj.address)),
  ];

  if (profileWalletAddresses.length === 0) {
    throw new AppError(BulkBalancesErrors.NoRegisteredAddresses);
  }
  console.log('profileWalletAddresses', profileWalletAddresses);

  const balances: bulkBalanceResp = {};

  // Iterate through chain nodes
  for (const nodeIdString of Object.keys(chainNodes)) {
    let tokenAddresses = req.body.chainNodes[nodeIdString];
    const nodeId = parseInt(nodeIdString, 10);

    // Handle when only one value in array
    if (typeof tokenAddresses === 'string') {
      tokenAddresses = [tokenAddresses];
    }

    // Handle no token addresses for chain node
    if (!tokenAddresses || tokenAddresses.length === 0) {
      let balanceTotal = 0;
      for (const userWalletAddress of profileWalletAddresses) {
        try {
          const balance = await tokenBalanceCache.getBalance(
            nodeId,
            userWalletAddress
          );
          balanceTotal += balance.toNumber();
        } catch (e) {
          console.log(
            "Couldn't get balance for chainNode Id ",
            nodeId,
            ' with wallet ',
            userWalletAddress
          );
        }
      }
      balances[nodeId] = balanceTotal;
    } else {
      const tokenBalances: { [tokenAddress: string]: number } = {};

      // Build token balances for each address
      for (const tokenAddress of tokenAddresses) {
        let balanceTotal = 0;
        for (const userWalletAddress of profileWalletAddresses) {
          try {
            // TODO: Needs to change to support 721 and spl-token when Zak contracts table is merged
            const balance = await tokenBalanceCache.getBalance(
              nodeId,
              userWalletAddress,
              tokenAddress,
              'erc20'
            );
            balanceTotal += balance.toNumber();
          } catch (e) {
            console.log(
              "Couldn't get balance for token address",
              tokenAddress,
              ' with wallet ',
              userWalletAddress,
              'on chainNode Id',
              nodeId
            );
          }
        }
        tokenBalances[tokenAddress] = balanceTotal;
      }

      balances[nodeId] = tokenBalances;
    }
  }

  return success(res, balances);
};

export default bulkBalances;
