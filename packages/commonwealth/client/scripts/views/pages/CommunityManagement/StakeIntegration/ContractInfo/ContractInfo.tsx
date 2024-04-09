import { formatAddressShort } from 'helpers';
import React from 'react';
import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './ContractInfo.scss';

interface ContractInfo {
  contractAddress: string;
  bondingCurveAddress?: string;
  voteWeightPerStake: string;
}

const ContractInfo = ({
  contractAddress,
  bondingCurveAddress,
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
      {bondingCurveAddress && (
        <div className="row">
          <CWText type="b2">Bonding curve</CWText>
          <CWText type="b1" fontWeight="medium">
            {formatAddressShort(bondingCurveAddress, 5, 5)}
            <CWIcon
              className="copy-icon"
              iconName="copyNew"
              onClick={async () =>
                await saveToClipboard(bondingCurveAddress, true)
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
        // TODO: navigate
      />
    </section>
  );
};

export default ContractInfo;
