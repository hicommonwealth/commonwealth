import React from 'react';

import './CWRadioPanelGroup.scss';

interface CWRadioPanelGroupProps {
  children: React.ReactNode;
}

export const CWRadioPanelGroup = ({ children }: CWRadioPanelGroupProps) => {
  return <div className="RadioPanelGroup">{children}</div>;
};
