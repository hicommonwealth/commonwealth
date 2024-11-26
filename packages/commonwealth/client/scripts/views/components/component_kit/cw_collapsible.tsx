import React from 'react';

import './cw_collapsible.scss';
import { CWIconButton } from './cw_icon_button';

import { ComponentType } from './types';

type CollapsibleProps = {
  collapsibleContent: React.ReactNode;
  headerContent: React.ReactNode;
};

export const CWCollapsible = (props: CollapsibleProps) => {
  const { collapsibleContent, headerContent } = props;

  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  return (
    <div className={ComponentType.Collapsible}>
      <div className="header-and-content-container">
        <div className="collapsible-header">
          <div className="expand-icon-button">
            <CWIconButton
              iconName={isExpanded ? 'chevronDown' : 'chevronRight'}
              iconSize="large"
              onClick={() => {
                setIsExpanded(!isExpanded);
              }}
            />
          </div>
          {headerContent}
        </div>
        <div className="content-container">
          {isExpanded && collapsibleContent}
        </div>
      </div>
    </div>
  );
};
