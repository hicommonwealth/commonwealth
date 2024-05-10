import React, { useState } from 'react';

import app from 'state';
import {
  useFetchEthUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import {
  useFundContestOnchainMutation,
  useGetContestBalanceQuery,
} from 'state/api/contests';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { convertEthToUsd } from 'views/modals/ManageCommunityStakeModal/utils';

import {
  FundContestFailure,
  FundContestForm,
  FundContestLoading,
  FundContestSuccess,
} from './steps';

import './FundContestDrawer.scss';

interface FundContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contestAddress: string;
}

export type FundContestStep = 'Form' | 'Loading' | 'Success' | 'Failure';

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
}: FundContestDrawerProps) => {
  const addressOptions = app?.user?.activeAccounts?.map((account) => ({
    value: String(account.address),
    label: account.address,
  }));

  const activeAccountOption = {
    value: String(app.user?.activeAccount?.address),
    label: app?.user?.activeAccount?.address,
  };

  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: activeAccountOption.value,
    apiEnabled: !!activeAccountOption.value,
    ethChainId,
  });

  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const { mutateAsync: fundContest } = useFundContestOnchainMutation();

  const { data: contestBalanceData } = useGetContestBalanceQuery({
    contestAddress,
    chainRpc,
    ethChainId,
  });

  const [fundContestDrawerStep, setFundContestDrawerStep] =
    useState<FundContestStep>('Form');
  const [selectedAddress, setSelectedAddress] = useState(activeAccountOption);
  const [amountEth, setAmountEth] = useState('0.0001');

  const contestEthBalance = String(contestBalanceData || '');
  const amountEthInUsd = convertEthToUsd(amountEth, ethUsdRate);

  const amountError =
    (parseFloat(userEthBalance) < parseFloat(amountEth) &&
      'Not enough funds in wallet') ||
    ((amountEth === '' || parseFloat(amountEth) === 0) &&
      'Please enter an amount') ||
    (parseFloat(amountEth) < 0 && 'Please enter non negative amount');
  const newContestBalanceInEth = String(
    parseFloat(contestEthBalance) + parseFloat(amountEth) || '',
  );
  const newContestBalanceInUsd = convertEthToUsd(
    newContestBalanceInEth,
    ethUsdRate,
  );
  const transferFeesInEth = String(parseFloat(amountEth) * 0.02 || '');
  const transferFeesInUsd = convertEthToUsd(transferFeesInEth, ethUsdRate);

  const handleChangeEthAmount = (e) => {
    setAmountEth(e.target.value);
  };

  const handleTransferFunds = async () => {
    try {
      setFundContestDrawerStep('Loading');

      await fundContest({
        contestAddress,
        ethChainId,
        chainRpc,
        amount: Number(amountEth),
        walletAddress: selectedAddress.value,
      });

      setFundContestDrawerStep('Success');
    } catch (err) {
      setFundContestDrawerStep('Failure');
    }
  };

  const handleClose = () => {
    onClose();
    setFundContestDrawerStep('Form');
    setAmountEth('0.0001');
    setSelectedAddress(activeAccountOption);
  };

  const getCurrentStep = () => {
    switch (fundContestDrawerStep) {
      case 'Form':
        return (
          <FundContestForm
            onClose={handleClose}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            handleTransferFunds={handleTransferFunds}
            amountEth={amountEth}
            amountError={amountError}
            handleChangeEthAmount={handleChangeEthAmount}
            selectedAddress={selectedAddress}
            onSetSelectedAddress={setSelectedAddress}
            addressOptions={addressOptions}
            userEthBalance={userEthBalance}
            contestEthBalance={contestEthBalance}
            amountEthInUsd={amountEthInUsd}
            newContestBalanceInEth={newContestBalanceInEth}
            newContestBalanceInUsd={newContestBalanceInUsd}
            transferFeesInEth={transferFeesInEth}
            transferFeesInUsd={transferFeesInUsd}
            contestAddress={contestAddress}
          />
        );

      case 'Loading':
        return <FundContestLoading />;

      case 'Failure':
        return (
          <FundContestFailure
            onSetFundContestDrawerStep={setFundContestDrawerStep}
          />
        );

      case 'Success':
        return (
          <FundContestSuccess onClose={handleClose} address={contestAddress} />
        );
    }
  };

  return (
    <div className="FundContestDrawer">
      <CWDrawer open={isOpen} onClose={handleClose}>
        <CWDrawerTopBar onClose={handleClose} />
        <div className="fund-contest-drawer-container">{getCurrentStep()}</div>
      </CWDrawer>
    </div>
  );
};

export default FundContestDrawer;
