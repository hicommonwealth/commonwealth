import BN from 'bn.js';
import app from 'state';
import {
  ChainNetwork,
  ContractType,
} from '../../../../common-common/src/types';
import axios from 'axios';

export const getTokenBalance = async () => {
  if (
    app.user.activeAccounts[0] &&
    app.chain.gatedTopics?.length > 0 &&
    !app.user.activeAccounts[0].tokenBalance
  ) {
    try {
      const contract =
        app.chain.network == ChainNetwork.SPL
          ? app.contracts.getByType(ContractType.SPL)
          : app.contracts.getCommunityContracts();
      axios
        .post(`${app.serverUrl()}/tokenBalance`, {
          chain: app.chain.meta.id,
          address: app.user.activeAccounts[0].address,
          author_chain: app.chain.meta.id,
          contract_address: contract.length > 0 ? contract[0].address : null,
          all: true,
        })
        .then((balanceResp) => {
          if (balanceResp.data?.result) {
            balanceResp.data.result.forEach((balObj) => {
              const account = app.user.activeAccounts.find(
                (acc) => acc.address == balObj.address.distinctAddress
              );
              if (account) account.setTokenBalance(new BN(balObj.balance, 10));
            });
          }
        });
    } catch {
      console.log('address not compatible');
    }
  }
};
