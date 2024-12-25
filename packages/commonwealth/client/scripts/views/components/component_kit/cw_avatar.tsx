import React from 'react';
import Jdenticon from 'react-jdenticon';
import { Skeleton } from '../Skeleton';
import './cw_avatar.scss';
import { ComponentType } from './types';

type BaseAvatarProps = {
  size: number;
};

type AvatarProps = BaseAvatarProps & { avatarUrl: string };

export const CWAvatarSkeleton = ({ size }: BaseAvatarProps) => {
  return (
    <Skeleton
      circle
      className={ComponentType.Avatar}
      width={size}
      height={size}
    />
  );
};

// eslint-disable-next-line react/no-multi-comp
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

// eslint-disable-next-line react/no-multi-comp
export const CWJdenticon = (props: JdenticonProps) => {
  const { address, size } = props;

  if (!address) return null;

  return <Jdenticon value={address.toString()} size={size.toString()} />;
};
