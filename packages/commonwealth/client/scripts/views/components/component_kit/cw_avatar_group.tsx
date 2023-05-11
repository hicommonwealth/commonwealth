import React from 'react';

import type MinimumProfile from '../../../models/MinimumProfile';

import 'components/component_kit/cw_avatar_group.scss';
import { CWAvatar, CWJdenticon } from './cw_avatar';
import { CWText } from './cw_text';

export type ProfileWithAddress = MinimumProfile & {
  Addresses: any;
};

type AvatarGroupProps = {
  profiles: ProfileWithAddress[];
  chainId: string;
};

export const CWAvatarGroup = (props: AvatarGroupProps) => {
  const { profiles, chainId } = props;

  if (!profiles || profiles?.length === 0) return;

  const truncatedProfiles = profiles.slice(0, 4).reverse();

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
              return addr.chain == chainId;
            });

            return (
              <div className="avatar-group-icon" key={i}>
                <CWJdenticon address={address.address} size={16} />
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
