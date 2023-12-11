import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import { CWText } from 'views/components/component_kit/cw_text';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

import './CWModalSelectButton.scss';

interface CWModalSelectButtonProps {
  header: string;
  headerInfo?: string;
  subheader: string;
  onClick: () => void;
}

const CWModalSelectButton = ({
  header,
  headerInfo,
  subheader,
  onClick,
}: CWModalSelectButtonProps) => {
  return (
    <div className={ComponentType.ModalSelectButton} onClick={onClick}>
      <div className="left-side">
        <div className="header">
          <CWText type="h5">{header}</CWText>
          {headerInfo && <CWText className="header-info">{headerInfo}</CWText>}
        </div>
        <CWText type="b1" className="subheader">
          {subheader}
        </CWText>
      </div>
      <CWIcon iconName="caretRight" iconSize="large" />
    </div>
  );
};

export default CWModalSelectButton;
