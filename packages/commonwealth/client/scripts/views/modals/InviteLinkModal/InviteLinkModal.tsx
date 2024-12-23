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

import app from 'state';
import useUserStore from 'state/ui/user';

import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  onModalClose: () => void;
}

const InviteLinkModal = ({ onModalClose }: InviteLinkModalProps) => {
  const user = useUserStore();
  const hasJoinedCommunity = !!user.activeAccount;
  const communityId = hasJoinedCommunity ? app.activeChainId() : '';

  const currentUrl = window.location.origin;

  // TODO: @Marcin to check address access (referral link creation) + related changes in this file
  const inviteLink = `${currentUrl}${
    communityId ? `/${communityId}/discussions` : '/dashboard'
  }?refcode=${user.activeAccount?.address}`;

  const handleCopy = () => {
    saveToClipboard(inviteLink, true).catch(console.error);
  };

  const shareOptions = getShareOptions(!!communityId, inviteLink);

  return (
    <div className="InviteLinkModal">
      <CWModalHeader
        label={
          communityId ? 'Community invite link' : 'Commonwealth invite link'
        }
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div className="content">
          <CWText>
            {communityId
              ? 'Get more voting power in your communities when people join with your referral link.'
              : `When you refer your friends to Common, you'll get a portion of any fees they pay to 
              Common over their lifetime engaging with web 3 native forums.`}
          </CWText>
          <>
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
          </>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <></>
      </CWModalFooter>
    </div>
  );
};

export default InviteLinkModal;
