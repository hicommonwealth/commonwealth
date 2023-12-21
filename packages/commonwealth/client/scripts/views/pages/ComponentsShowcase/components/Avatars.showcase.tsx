import React from 'react';

import ChainInfo from 'models/ChainInfo';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import {
  CWAvatarGroup,
  ProfileWithAddress,
} from 'views/components/component_kit/cw_avatar_group';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';

const avatarGroupProfiles = [
  {
    Addresses: [
      {
        address: '0x067a7910789f214A13E195a025F881E9B59C4D76',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0xA85E7767b5DAfFeA56d3cDDcDA9c88ecFEc500Eb',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x555BEBfa94d60F82B71cebB70c614780FDd66F82',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x9A8DB742A08f223c0EdE6D6bb64386Fc971184D8',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0xE93D59CC0bcECFD4ac204827eF67c5266079E2b5',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x106d7E0a8a1e9303CD9db0f6C8946A9Ce6427935',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x43D3938Ebd74106e2d177f9A304C1E9f914f2b52',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x070341aA5Ed571f0FB2c4a5641409B1A46b4961b',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0xdd1ECAe49312F5a2FeF65d13327E92D32864fDEe',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0xb55a948763e0d386b6dEfcD8070a522216AE42b1',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x77EC061aC11df6b42Af3784BCE835A5feAF247Dd',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0x6fe619c554D7B435C90911e043304C95e959105c',
      },
    ],
  },
  {
    Addresses: [
      {
        address: '0xDf71878436e521e430fACf36ee5e3D74fA519F2c',
      },
    ],
  },
];

const communityAvatar = {
  name: 'dYdX',
  iconUrl:
    'https://assets.commonwealth.im/5d4b9152-f45f-4864-83e5-074e0e892688.1627998072164',
};
const AvatarsShowcase = () => {
  return (
    <>
      <CWText type="h5">Avatar</CWText>
      <div className="flex-row">
        <CWAvatar avatarUrl="/static/img/ghost.svg" size={16} />
        <CWAvatar avatarUrl="/static/img/ghost.svg" size={20} />
        <CWAvatar avatarUrl="/static/img/ghost.svg" size={24} />
        <CWAvatar avatarUrl="/static/img/ghost.svg" size={32} />
      </div>

      <CWText type="h5">Avatar Group</CWText>
      <div className="flex-row">
        <CWAvatarGroup
          profiles={avatarGroupProfiles as ProfileWithAddress[]}
          communityId="dydx"
        />
      </div>

      <CWText type="h5">Community Avatar</CWText>
      <div className="flex-row">
        <CWCommunityAvatar
          size="small"
          community={communityAvatar as ChainInfo}
        />
        <CWCommunityAvatar
          size="medium"
          community={communityAvatar as ChainInfo}
        />
        <CWCommunityAvatar size="xl" community={communityAvatar as ChainInfo} />
        <CWCommunityAvatar
          size="xxl"
          community={communityAvatar as ChainInfo}
        />
      </div>
    </>
  );
};

export default AvatarsShowcase;
