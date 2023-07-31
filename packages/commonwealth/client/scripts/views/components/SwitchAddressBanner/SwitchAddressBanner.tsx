import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import React from 'react';

interface JoinCommunityBannerProps {
  communityName: string;
  onCommunityJoin: () => void;
  onAddressSwitch: () => void;
  onClose: () => void;
}

const SwitchAddressBanner = ({
  communityName,
  onClose,
  onCommunityJoin,
  onAddressSwitch,
}: JoinCommunityBannerProps) => {
  return (
    <CWBanner
      type="info"
      title={`Please switch to the address connected to ${communityName}`}
      body="You joined this community with a different address under your profile.
        Please switch to the address connected to this community to
        create and engage with threads and governance or join
        the community again with your current selected address."
      buttons={[
        {
          label: 'Switch to connected address',
          onClick: onAddressSwitch,
        },
        { label: 'Join with current address', onClick: onCommunityJoin },
      ]}
      onClose={onClose}
    />
  );
};

export default SwitchAddressBanner;
