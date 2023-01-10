import BN from 'bn.js';
import axios from 'axios';
import { BalanceType } from 'common-common/src/types';
import { Bech32 } from '@cosmjs/encoding';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';

export default class TerraBalanceProvider extends BalanceProvider {
  public name = 'terra';
  public opts = {};
  public validBases = [BalanceType.Terra];

  // TODO: update against staking logic on master
  public async getBalance(node: IChainNode, address: string): Promise<string> {
    // re-encode address if necessary
    if (!node.bech32) {
      throw new Error('No cosmos prefix found!');
    }
    const { data } = Bech32.decode(address);
    const encodedAddress = Bech32.encode(node.bech32, data);

    // make balance query
    const queryUrl = `${
      node.private_url || node.url
    }/cosmos/bank/v1beta1/balances/${encodedAddress}`;

    let bankBalance = new BN(0);
    try {
      // NOTE: terra.js staking module is incompatible with stargate queries
      const balResp = await axios.get(queryUrl); // [ { denom: 'uluna', amount: '5000000' } ]
      const balances: Array<{ denom: string; amount: string }> =
        balResp?.data?.balances;
      if (balances?.length > 0) {
        const balanceObj = balances.find(({ denom }) => denom === 'uluna');
        if (balanceObj) {
          bankBalance = new BN(balanceObj.amount);
        }
      }
    } catch (e) {
      throw new Error(`could not fetch terra bank balance: ${e.message}`);
    }

    // make staking query
    let stakedBalance = new BN(0);
    const stakedQueryUrl = `${
      node.private_url || node.url
    }/cosmos/staking/v1beta1/delegations/${encodedAddress}`;

    try {
      // NOTE: terra.js staking module is incompatible with stargate queries
      // TODO: support pagination (currently few users, if any, will have enough delegations to trigger it)
      const balResp = await axios.get(stakedQueryUrl); // [ { denom: 'uluna', amount: '5000000' } ]
      const delegations: Array<{ balance: { denom: string; amount: string } }> =
        balResp?.data?.delegation_responses;

      // sum all delegation balanaces to produce total staked balance
      for (const delegation of delegations) {
        if (delegation?.balance && delegation.balance.denom === 'uluna') {
          stakedBalance = stakedBalance.add(new BN(delegation.balance.amount));
        }
      }
    } catch (e) {
      throw new Error(`could not fetch staked terra balance: ${e.message}`);
    }

    return bankBalance.add(stakedBalance).toString();
  }
}
