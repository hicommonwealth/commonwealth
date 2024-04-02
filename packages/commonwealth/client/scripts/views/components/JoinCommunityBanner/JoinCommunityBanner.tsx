import React from 'react';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';

interface JoinCommunityBannerProps {
  onClose: () => void;
  onJoin: () => Promise<boolean>;
}
const JoinCommunityBanner = ({ onClose, onJoin }: JoinCommunityBannerProps) => {
  return (
    <CWBanner
      className="JoinCommunityBanner"
      title="Want to contribute to this discussion?"
      body="Join now to engage in discussions, leave comments, reply to others,
                    upvote content, and enjoy a host of additional features."
      buttons={[
        {
          label: 'Join community',
          buttonType: 'primary',
          onClick: onJoin,
        },
      ]}
      onClose={onClose}
    />
  );
};

export default JoinCommunityBanner;
