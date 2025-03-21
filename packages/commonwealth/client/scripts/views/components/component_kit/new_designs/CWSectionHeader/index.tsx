import React from 'react';
import { CWIcon } from '../../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../../component_kit/cw_text';
import './index.scss';

interface CWSectionHeaderProps {
  title: string;
  seeAllText: string;
  onSeeAllClick: () => void;
}

export const CWSectionHeader: React.FC<CWSectionHeaderProps> = ({
  title,
  seeAllText,
  onSeeAllClick,
}) => {
  return (
    <div className="heading-container">
      <CWText type="h2">{title}</CWText>
      <div className="link-right" onClick={onSeeAllClick}>
        <CWText className="link">{seeAllText}</CWText>
        <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
      </div>
    </div>
  );
};

export default CWSectionHeader;
