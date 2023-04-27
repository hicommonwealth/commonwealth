import React from 'react';

import { formatCoin } from 'adapters/currency';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import app from 'state';
import { CWText } from '../component_kit/cw_text';

type BalanceInfoProps = {
  account: SubstrateAccount;
};

export const BalanceInfo = (props: BalanceInfoProps) => {
  const { account } = props;

  const [balance, setBalance] = React.useState<any>();
  const [freeBalance, setFreeBalance] = React.useState<any>();
  const [lockedBalance, setLockedBalance] = React.useState<any>();

  React.useEffect(() => {
    app.runWhenReady(async () => {
      setFreeBalance(await account.freeBalance);
      setLockedBalance(await account.lockedBalance);
      setBalance(await account.balance);
    });
  }, []);

  return (
    <>
      <CWText>Free: {freeBalance ? formatCoin(freeBalance) : '--'}</CWText>
      <CWText>
        Locked: {lockedBalance ? formatCoin(lockedBalance) : '--'}
      </CWText>
      <CWText>Total: {balance ? formatCoin(balance) : '--'}</CWText>
    </>
  );
};
