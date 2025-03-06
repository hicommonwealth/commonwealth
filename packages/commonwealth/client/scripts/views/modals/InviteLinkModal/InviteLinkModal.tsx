import { uniqBy } from 'lodash';
import React, { useState } from 'react';

import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { getShareOptions } from './utils';

import { formatAddressShort } from 'helpers';
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

  const availableAddresses = uniqBy(user.addresses, 'address');

  const addressOptions = availableAddresses.map((addressInfo) => ({
    value: addressInfo.address,
    label: formatAddressShort(addressInfo.address, 6),
  }));

  const refAddress = communityId
    ? user.activeAccount?.address
    : addressOptions?.[0]?.value;

  const [refCode, setRefCode] = useState(refAddress);

  const currentUrl = window.location.origin;

  const inviteLink = `${currentUrl}${
    communityId ? `/${communityId}/discussions` : '/dashboard'
  }?refcode=${refCode}`;

  const handleCopy = () => {
    saveToClipboard(inviteLink, true).catch(console.error);
  };

  const shareOptions = getShareOptions(!!communityId, inviteLink);

  return (
    <div className="InviteLinkModal">
      <CWModalHeader
        label={communityId ? 'Community invite link' : 'Common invite link'}
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div className="content">
          <CWText>
            {communityId
              ? 'Get more voting power in your communities when people join with your referral link.'
              : `For every referral, you'll soon get offchain and onchain rewards, like fees from trades, swaps, and transactions they make on Common.`}
          </CWText>
          <CWText type="b2">
            Fees are Base only for now, more networks coming soon!
          </CWText>
          <>
            <CWSelectList
              label="Select Address"
              placeholder="Select a wallet"
              isClearable={false}
              isSearchable={false}
              value={addressOptions.find((option) => option.value === refCode)}
              defaultValue={addressOptions[0]}
              options={addressOptions}
              onChange={(option) => setRefCode(option?.value)}
            />

            <CWTextInput
              inputClassName="invite-link-input"
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
