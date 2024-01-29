import React from 'react';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import type { IconName } from './component_kit/cw_icons/cw_icon_lookup';

type SocialAccountProps = {
  iconName: IconName;
  link: string;
};

export const SocialAccount = ({ iconName, link }: SocialAccountProps) => {
  let formattedLink;
  if (link.includes('@')) {
    formattedLink = link;
  } else {
    formattedLink = link.includes('http') ? link : `https://${link}`;
  }

  return (
    <a href={formattedLink} target="_blank" rel="noreferrer">
      <CWIcon iconName={iconName} className="social-icon" />
    </a>
  );
};

export default SocialAccount;
