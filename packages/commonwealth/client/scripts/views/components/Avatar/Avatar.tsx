import React from 'react';
import {
  CWAvatar,
  CWJdenticon,
} from 'views/components/component_kit/cw_avatar';

interface AvatarProps {
  url: string;
  size?: number;
  address?: number;
}

export const Avatar = ({ url, size, address }: AvatarProps) => {
  if (url) {
    return <CWAvatar avatarUrl={url} size={size} />;
  }

  if (address) {
    return <CWJdenticon address={String(address)} size={size} />;
  }

  return null;
};
