/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';
import Jdenticon from 'react-jdenticon';

import 'components/component_kit/cw_avatar.scss';

import { ComponentType } from './types';

type BaseAvatarProps = {
  size: number;
};

type AvatarProps = BaseAvatarProps & { avatarUrl: string };

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

  return <Jdenticon value={address.toString()} height={size} width={size} />;
};
