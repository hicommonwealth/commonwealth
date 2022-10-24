import BN from 'bn.js';
import axios from 'axios';

import { BalanceProvider, IChainNode } from "../types";
import { BalanceType } from 'common-common/src/types';

export default class TerraBalanceProvider extends BalanceProvider {
  public name = 'terra';
  public opts = {};
  public validBases = [BalanceType.Terra];

  public async getBalance(node: IChainNode, address: string): Promise<string> {
    if (!process.env.TERRA_SETTEN_PHOENIX_API_KEY) {
      throw new Error('No API key found for terra endpoint');
    }

    // make balance query
    const queryUrl = `${node.private_url || node.url}/cosmos/bank/v1beta1/balances/${
      address
    }?key=${
      process.env.TERRA_SETTEN_PHOENIX_API_KEY
    }`;

    try {
      // NOTE: terra.js staking module is incompatible with stargate queries
      const balResp = await axios.get(queryUrl); // [ { denom: 'uluna', amount: '5000000' } ]
      const balances: Array<{ denom: string, amount: string }> = balResp?.data?.balances;
      let balance = new BN(0);
      if (balances?.length > 0) {
        const balanceObj = balances.find(({ denom }) => denom === 'uluna');
        if (balanceObj) {
          balance = new BN(balanceObj.amount);
        }
      }
      return balance.toString();
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }
}