import BN from 'bn.js';
import app from 'state';

export const getTokenBalance = async () => {
  if (
    app.user.activeAccounts[0] &&
    app.chain.gatedTopics?.length > 0 &&
    !app.user.activeAccounts[0].tokenBalance
  ) {
    try {
      const contract = app.contracts.getCommunityContracts();
      await $.post(`${app.serverUrl()}/tokenBalance`, {
        chain: app.chain.meta.id,
        address: app.user.activeAccounts[0].address,
        author_chain: app.chain.meta.id,
        contract_address: contract.length > 0 ? contract[0].address : null,
        all: true,
      }).then((balanceResp) => {
        if (balanceResp.result) {
          balanceResp.result.forEach((balObj) => {
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
