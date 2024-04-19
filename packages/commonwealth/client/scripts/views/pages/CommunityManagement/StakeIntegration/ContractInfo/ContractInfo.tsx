import { formatAddressShort } from 'helpers';
import React from 'react';
import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './ContractInfo.scss';

interface ContractInfo {
  contractAddress: string;
  smartContractAddress?: string;
  voteWeightPerStake: string;
}

const ContractInfo = ({
  contractAddress,
  smartContractAddress,
  voteWeightPerStake,
}: ContractInfo) => {
  return (
    <section className="ContractInfo">
      <CWText type="h4">Stake contract info</CWText>
      <div className="row">
        <CWText type="b2">Namespace (1155) contract</CWText>
        <CWText type="b1" fontWeight="medium">
          {formatAddressShort(contractAddress, 5, 5)}
          <CWIcon
            className="copy-icon"
            iconName="copyNew"
            onClick={async () => await saveToClipboard(contractAddress, true)}
          />
        </CWText>
      </div>
      {smartContractAddress && (
        <div className="row">
          <CWText type="b2">Smart contract</CWText>
          <CWText type="b1" fontWeight="medium">
            {formatAddressShort(smartContractAddress, 5, 5)}
            <CWIcon
              className="copy-icon"
              iconName="copyNew"
              onClick={async () =>
                await saveToClipboard(smartContractAddress, true)
              }
            />
          </CWText>
        </div>
      )}
      <div className="row">
        <CWText type="b2">Vote weight multiplier</CWText>
        <CWText type="b1">1 stake = {voteWeightPerStake} vote weight</CWText>
      </div>
      <CWButton
        label="Learn more about community stake"
        iconRight="externalLink"
        buttonType="tertiary"
        onClick={() => {
          window.open(
            'https://docs.common.xyz/commonwealth/community-overview/community-stake',
          );
        }}
      />
    </section>
  );
};

export default ContractInfo;
