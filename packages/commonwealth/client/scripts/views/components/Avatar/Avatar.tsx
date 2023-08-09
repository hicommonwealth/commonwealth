import React from 'react';
import {
  CWAvatar,
  CWJdenticon,
} from 'views/components/component_kit/cw_avatar';

enum AvatarSizes {
  Sm = 16,
  Med = 24,
  Lg = 32,

  // TODO: this is to account for sizing in the avatar upload
  Tmp1 = 60,
  Tmp2 = 108
};

interface AvatarProps {
  url: string;
  size?: AvatarSizes;
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
