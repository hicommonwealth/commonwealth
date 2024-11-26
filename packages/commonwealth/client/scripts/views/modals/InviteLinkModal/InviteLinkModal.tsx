import React from 'react';

import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';

import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  onModalClose: () => void;
  isInsideCommunity: boolean;
}

const InviteLinkModal = ({
  onModalClose,
  isInsideCommunity,
}: InviteLinkModalProps) => {
  const value = 'https://commonwealth.im/~/invite/774037=89defcb8';

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
              Common over their lifetime engaging with web 3 native forums`}
          </CWText>

          <CWTextInput
            fullWidth
            type="text"
            value={value}
            disabled
            iconRight={<CWIcon iconName="copy" />}
          />
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton label="Close" onClick={onModalClose} />
      </CWModalFooter>
    </div>
  );
};

export default InviteLinkModal;
