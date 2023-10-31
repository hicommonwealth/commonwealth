import React from 'react';

import type MinimumProfile from '../../../models/MinimumProfile';

import 'components/component_kit/cw_avatar_group.scss';
import { CWAvatar, CWJdenticon } from './cw_avatar';
import { CWText } from './cw_text';

export type ProfileWithAddress = MinimumProfile & {
  Addresses: {
    address: string;
    community_id: string;
    id: number;
    profile_id: number;
  }[];
};

type AvatarGroupProps = {
  profiles: ProfileWithAddress[];
  chainId: string;
};

export const CWAvatarGroup = (props: AvatarGroupProps) => {
  const { profiles, chainId } = props;

  if (!profiles || profiles?.filter((p) => !!p && p.Addresses).length === 0)
    return;

  const truncatedProfiles = profiles
    .filter((p) => !!p && p.Addresses)
    .slice(0, 4)
    .reverse();

  const count = profiles.length - 4;
  let countText;

  if (count > 5) {
    countText = `+${count} others`;
  } else if (count === 1) {
    countText = '+1 other';
  } else {
    countText = '';
  }

  return (
    <div className="AvatarGroup">
      <div className="avatar-group-icons">
        {truncatedProfiles.map((profile, i) => {
          if (profile.avatarUrl) {
            return (
              <div className="avatar-group-icon" key={i}>
                <CWAvatar avatarUrl={profile.avatarUrl} size={16} />
              </div>
            );
          } else {
            const address = profile.Addresses.find((addr) => {
              return addr.community_id == chainId;
            });

            // some old posts are broken = have no address in the specified community.
            // if so, we display an arbitrary icon based on their non-chain address.
            const displayAddress =
              address?.address || profile.Addresses[0].address;

            return (
              <div className="avatar-group-icon" key={i}>
                <CWJdenticon address={displayAddress} size={16} />
              </div>
            );
          }
        })}
      </div>
      <CWText className="avatar-group-count" type="caption">
        {countText}
      </CWText>
    </div>
  );
};
