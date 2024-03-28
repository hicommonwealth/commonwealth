import React from 'react';

import app from 'state';
import { saveToClipboard } from 'utils/clipboard';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import { ManageCommunityStakeModalMode } from '../types';
import { buildEtherscanLink } from '../utils';

import './TransactionSucceeded.scss';

interface TransactionSucceededProps {
  onModalClose: () => void;
  mode: ManageCommunityStakeModalMode;
  successTransactionHash: string;
}

const TransactionSucceeded = ({
  onModalClose,
  mode,
  successTransactionHash,
}: TransactionSucceededProps) => {
  const chainNodeName = app.config.nodes.getById(
    app.config.chains.getById(app.activeChainId()).id,
  ).ethChainId;
  const etherscanLink = buildEtherscanLink(
    chainNodeName,
    successTransactionHash,
  );

  const handleOpenExternalLink = () => {
    window.open(etherscanLink, '_blank');
  };

  const handleCopyLink = async () => {
    await saveToClipboard(etherscanLink, true);
  };

  const conditionalText =
    mode === 'buy'
      ? {
          icon: <div className="emoji">🎉</div>,
          header: 'You bought stake!',
          description: 'You have successfully increased your vote weight in ',
          descriptionSuffix: ' by buying stake.',
        }
      : {
          icon: (
            <CWIcon
              iconSize="xl"
              iconName="checkCircleFilled"
              className="check-icon"
            />
          ),
          header: 'You sold stake!',
          description: 'You have successfully sold stake in ',
          descriptionSuffix: '.',
        };

  return (
    <div className="TransactionSucceeded">
      <CWModalBody>
        {conditionalText.icon}
        <CWText fontWeight="medium">{conditionalText.header}</CWText>
        <CWText type="b2" className="success-info">
          {conditionalText.description}
          <CWText type="b2" fontWeight="medium">
            {app?.chain?.meta?.name}
          </CWText>
          {conditionalText.descriptionSuffix}
        </CWText>

        <CWDivider className="divider" />

        <div className="under-divider">
          <CWText type="caption">
            Don&apos;t trust, verify. Track your transaction on Etherscan.
          </CWText>
          <div className="buttons-row">
            <CWButton
              buttonHeight="sm"
              buttonType="secondary"
              label="View on Etherscan"
              iconLeft="etherscan"
              iconRight="externalLink"
              onClick={handleOpenExternalLink}
            />
            <CWText type="caption">or</CWText>
            <CWButton
              buttonHeight="sm"
              buttonType="secondary"
              label="Copy link"
              iconRight="linkPhosphor"
              onClick={handleCopyLink}
            />
          </div>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Close"
          buttonType="primary"
          buttonWidth="full"
          onClick={onModalClose}
        />
      </CWModalFooter>
    </div>
  );
};

export default TransactionSucceeded;
