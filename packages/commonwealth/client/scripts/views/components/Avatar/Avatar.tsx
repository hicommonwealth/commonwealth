import React from 'react';
import {
  CWAvatar,
  CWJdenticon,
} from 'views/components/component_kit/cw_avatar';

enum AvatarSizes {
  Sm = 16,
  Med = 24,
  Lg = 36,

  // TODO: this is to account for sizing in user popover and avatar upload
  Tmp1 = 32,
  Tmp2 = 60, 
  Tmp3 = 108
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
