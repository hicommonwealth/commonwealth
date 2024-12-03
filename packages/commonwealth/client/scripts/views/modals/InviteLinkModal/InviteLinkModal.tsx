import React from 'react';

import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { getShareOptions } from './utils';

import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  onModalClose: () => void;
  isInsideCommunity: boolean;
}

const InviteLinkModal = ({
  onModalClose,
  isInsideCommunity,
}: InviteLinkModalProps) => {
  // TODO: replace with actual invite link from backend in upcoming PR
  const inviteLink = 'https://commonwealth.im/~/invite/774037=89defcb8';

  const handleCopy = () => {
    saveToClipboard(inviteLink, true).catch(console.error);
  };

  const shareOptions = getShareOptions(isInsideCommunity, inviteLink);

  return (
    <div className="InviteLinkModal">
      <CWModalHeader
        label={
          isInsideCommunity
            ? 'Community invite link'
            : 'Commonwealth invite link'
        }
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div className="content">
          <CWText>
            {isInsideCommunity
              ? 'Get more voting power in your communities when people join with your referral link.'
              : `When you refer your friends to Common, you'll get a portion of any fees they pay to 
              Common over their lifetime engaging with web 3 native forums.`}
          </CWText>

          <CWTextInput
            fullWidth
            type="text"
            value={inviteLink}
            readOnly
            onClick={handleCopy}
            iconRight={<CWIcon iconName="copy" />}
          />

          <div className="share-section">
            <CWText fontWeight="bold">Share to</CWText>
            <div className="share-options">
              {shareOptions.map((option) => (
                <div
                  key={option.name}
                  className="share-option"
                  onClick={option.onClick}
                >
                  <img src={option.icon} alt={option.name} className="icon" />
                  <CWText type="caption">{option.name}</CWText>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <></>
      </CWModalFooter>
    </div>
  );
};

export default InviteLinkModal;
