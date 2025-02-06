import React from 'react';
import {
  CWAvatar,
  CWAvatarSkeleton,
} from 'views/components/component_kit/cw_avatar';

interface AvatarProps {
  url: string;
  size?: number;
  address?: number;
  showSkeleton?: boolean;
}

export const Avatar = ({ url, size, address, showSkeleton }: AvatarProps) => {
  if (showSkeleton) {
    // @ts-expect-error StrictNullChecks
    return <CWAvatarSkeleton size={size} />;
  }

  if (url) {
    // @ts-expect-error StrictNullChecks
    return <CWAvatar avatarUrl={url} size={size} />;
  }

  return null;
};
