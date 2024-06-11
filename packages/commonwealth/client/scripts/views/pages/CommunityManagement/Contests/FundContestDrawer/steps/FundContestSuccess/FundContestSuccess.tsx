import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { buildEtherscanLink } from 'views/modals/ManageCommunityStakeModal/utils';

import CopyAddressInput from '../../../CopyAddressInput';

import contestFundSuccess from 'assets/img/contestFundsSuccess.png';
import './FundContestSuccess.scss';

interface FundContestSuccessProps {
  onClose: () => void;
  address: string;
  txHash: string;
}

const FundContestSuccess = ({
  onClose,
  address,
  txHash,
}: FundContestSuccessProps) => {
  const etherscanLink = buildEtherscanLink(txHash);

  return (
    <div className="FundContestSuccess">
      <div className="content">
        <img src={contestFundSuccess} alt="success" className="img" />
        <CWText type="h4">Your funds transferred successfully!</CWText>
        <CWText type="b1" className="description">
          Your contest is now active at the address below. You can now add funds
          to the contest at any time.
        </CWText>
        <CopyAddressInput address={address} />
      </div>

      <div className="footer">
        <CWDivider />
        <div className="buttons">
          <CWButton label="Close" onClick={onClose} buttonType="secondary" />
          <CWButton
            label="View transactions"
            onClick={() => window.open(etherscanLink, '_blank')}
          />
        </div>
      </div>
    </div>
  );
};

export default FundContestSuccess;
