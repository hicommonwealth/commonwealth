import React, { memo, useState } from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { ShareModal } from 'views/components/ShareModal/ShareModal';
import './InviteLinkModal.scss';
import { generateTextAndLink } from './utils';

interface InviteLinkModalProps {
  onModalClose: () => void;
}

const InviteLinkModal = memo(function InviteLinkModal({
  onModalClose,
}: InviteLinkModalProps) {
  const [communityId, setCommunityId] = useState<string | undefined>('');

  const currentUrl = window.location.origin;

  const inviteLink = `${currentUrl}${
    communityId ? `/${communityId}` : '/dashboard'
  }`;

  const textAndLink = generateTextAndLink(!!communityId, inviteLink);

  return (
    <div className="InviteLinkModal">
      <ShareModal
        open={true}
        headerLabel={
          communityId ? 'Community invite link' : 'Common invite link'
        }
        text={textAndLink.text}
        url={textAndLink.link}
        onClose={onModalClose}
        onCommunityChange={setCommunityId}
        BodyContent={() => (
          <>
            <CWText>
              {communityId
                ? 'Share your referral link and earn rewards when your community engages.'
                : `For every referral, you'll soon get offchain and onchain rewards, like fees from
                 trades, swaps, and transactions they make on Common.`}
            </CWText>
            <CWText type="b2">
              Fees are Base only for now, more networks coming soon!
            </CWText>
          </>
        )}
      />
    </div>
  );
});

export default InviteLinkModal;
