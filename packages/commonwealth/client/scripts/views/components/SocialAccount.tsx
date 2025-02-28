import React from 'react';
import SocialAccountLinkModal from '../modals/SocialAccountLinkModal';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import type { IconName } from './component_kit/cw_icons/cw_icon_lookup';
import { CWModal } from './component_kit/new_designs/CWModal';

type SocialAccountProps = {
  iconName: IconName;
  link: string;
  isSelected: boolean;
  onSelect: (link: string) => void;
  onModalClose: () => void;
};

export const SocialAccount = ({
  iconName,
  link,
  isSelected,
  onSelect,
  onModalClose,
}: SocialAccountProps) => {
  let formattedLink;
  if (link.includes('@')) {
    formattedLink = link;
  } else {
    formattedLink = link.includes('http') ? link : `https://${link}`;
  }

  return (
    <div>
      <CWIcon
        iconName={iconName}
        className="social-icon"
        onClick={() => onSelect(link)}
      />
      <CWModal
        size="small"
        content={
          <SocialAccountLinkModal
            onModalClose={onModalClose}
            formattedLink={formattedLink}
          />
        }
        onClose={onModalClose}
        open={isSelected}
      />
    </div>
  );
};

export default SocialAccount;
