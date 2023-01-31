/* @jsx jsx */
import React from 'react';

import { ClassComponent } from 'mithrilInterop';
import type { Profile } from 'client/scripts/models';

import 'components/component_kit/cw_avatar_group.scss';
import { CWAvatar, CWJdenticon } from './cw_avatar';
import { CWText } from './cw_text';

export type ProfileWithAddress = Profile & {
  Addresses: any;
};

type AvatarGroupAttrs = {
  profiles: ProfileWithAddress[];
  chainId: string;
};

export class CWAvatarGroup extends ClassComponent<AvatarGroupAttrs> {
  view(vnode: m.Vnode<AvatarGroupAttrs>) {
    const { profiles, chainId } = vnode.attrs;
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
          {truncatedProfiles.map((profile) => {
            if (profile.avatarUrl) {
              return (
                <div className="avatar-group-icon">
                  <CWAvatar avatarUrl={profile.avatarUrl} size={16} />
                </div>
              );
            }
            const address = profile.Addresses.find((addr) => {
              return addr.chain == chainId;
            });
            return (
              <div className="avatar-group-icon">
                <CWJdenticon address={address.address} size={16} />
              </div>
            );
          })}
        </div>
        <CWText className="avatar-group-count" type="caption">
          {countText}
        </CWText>
      </div>
    );
  }
}
