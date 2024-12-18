import { Link } from 'models/Thread';
import React from 'react';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';

interface UrlSelectorItemProps {
  link: Link;
  isSelected: boolean;
  onClick: (url: Link) => void;
}

const UrlSelectorItem = ({
  onClick,
  link,
  isSelected,
}: UrlSelectorItemProps) => {
  return (
    <div className="proposal-item">
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <CWText fontWeight="medium" truncate title={link.title!}>
          {link.title}
        </CWText>
        <CWText type="caption" title={link.identifier}>
          {link.identifier}
        </CWText>
      </div>
      <div className="trash-icon">
        <CWIconButton
          iconButtonTheme="neutral"
          iconName="trash"
          iconSize="medium"
          onClick={() => onClick(link)}
        />
      </div>
    </div>
  );
};

export { UrlSelectorItem };
