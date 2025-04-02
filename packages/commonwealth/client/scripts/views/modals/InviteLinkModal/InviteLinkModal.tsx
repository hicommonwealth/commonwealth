import React, { useCallback } from 'react';

import ShareSection from 'views/components/ShareSection';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  onModalClose: () => void;
}

const InviteLinkModal = ({ onModalClose }: InviteLinkModalProps) => {
  const url = useCallback((communityId: string | undefined) => {
    const currentUrl = window.location.origin;

    if (currentUrl) {
      return `${currentUrl}/${communityId}/discussions`;
    } else {
      return `${currentUrl}/dashboard`;
    }
  }, []);

  const text = () =>
    useCallback((communityId: string | undefined) => {
      const isInsideCommunity = !!communityId;

      if (isInsideCommunity) {
        return 'Join my Community on Common using my link!';
      } else {
        return 'Join me on Common using my link!';
      }
    }, []);

  return (
    <div className="InviteLinkModal">
      <CWModalHeader label="Common invite link" onModalClose={onModalClose} />
      <CWModalBody>
        <div className="content">
          <CWText>
            {communityId
              ? 'Share your referral link and earn rewards when your community engages.'
              : `For every referral, you'll soon get offchain and onchain rewards, like fees from 
              trades, swaps, and transactions they make on Common.`}
          </CWText>
          <CWText type="b2">
            Fees are Base only for now, more networks coming soon!
          </CWText>
          <>
            <ShareSection url={textAndLink.link} text={textAndLink.text} />
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
