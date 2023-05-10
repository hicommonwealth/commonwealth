import React from 'react';

import Jdenticon from 'react-jdenticon';

import 'components/component_kit/cw_avatar.scss';
import { render } from '../../../mithrilInterop/index';
import ChainInfo from '../../../models/ChainInfo';
import MinimumProfile from '../../../models/MinimumProfile';

import { ComponentType } from './types';

type BaseAvatarProps = {
  size: number;
};

type AvatarProps = BaseAvatarProps & { avatarUrl: string };

export function getAvatarFromProfile(minimumProfile: MinimumProfile, size: number) {
  return minimumProfile.avatarUrl
    ? render(CWAvatar, { avatarUrl: minimumProfile.avatarUrl, size })
    : render(CWJdenticon, { address: minimumProfile.id, size });
}

export function getAvatarFromChainInfo(chainInfo: ChainInfo, size: number) {
  return chainInfo?.iconUrl
    ? render(CWAvatar, { avatarUrl: chainInfo.iconUrl, size })
    : render(CWJdenticon, { address: undefined, size });
}

export const CWAvatar = (props: AvatarProps) => {
  const { avatarUrl, size } = props;

  return (
    <div
      className={ComponentType.Avatar}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url("${avatarUrl}")`,
      }}
    />
  );
};

type JdenticonProps = BaseAvatarProps & { address?: string };

export const CWJdenticon = (props: JdenticonProps) => {
  const { address, size } = props;

  if (!address) return null;

  return <Jdenticon value={address.toString()} size={size.toString()} />;
};
