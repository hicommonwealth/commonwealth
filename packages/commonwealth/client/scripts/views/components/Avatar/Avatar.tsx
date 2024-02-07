import React from 'react';
import {
  CWAvatar,
  CWAvatarSkeleton,
  CWJdenticon,
} from 'views/components/component_kit/cw_avatar';

interface AvatarProps {
  url: string;
  size?: number;
  address?: number;
  showSkeleton?: boolean;
}

export const Avatar = ({ url, size, address, showSkeleton }: AvatarProps) => {
  if (showSkeleton) {
    return <CWAvatarSkeleton size={size} />;
  }

  if (url) {
    return <CWAvatar avatarUrl={url} size={size} />;
  }

  if (address) {
    return <CWJdenticon address={String(address)} size={size} />;
  }

  return null;
};
