import clsx from 'clsx';
import React, { ReactNode, useState } from 'react';
import { CWCard } from '../cw_card';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import './CWContentPageCard.scss';

type ContentPageCardProps = {
  content: ReactNode;
  header: string;
  showCollapsedIcon?: boolean;
};

export const CWContentPageCard = (props: ContentPageCardProps) => {
  const { content, header, showCollapsedIcon = false } = props;
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <CWCard className={clsx('ContentPageCard', { isCollapsed: isCollapsed })}>
      <div className="header-container">
        <CWText type="h5" fontWeight="semiBold">
          {header}
        </CWText>
        {showCollapsedIcon && (
          <CWIcon
            iconName={isCollapsed ? 'caretDown' : 'caretUp'}
            iconSize="small"
            className="caret-icon"
            weight="bold"
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        )}
      </div>
      {!isCollapsed ? content : <></>}
    </CWCard>
  );
};
