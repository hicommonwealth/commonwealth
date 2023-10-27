import React from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { SubSectionGroup } from '../sidebar_section';

import './DirectoryMenuItem.scss';

const DirectoryMenuItem = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const matchesDirectoryRoute = matchRoutes(
    [{ path: '/directory' }, { path: ':scope/directory' }],
    location
  );

  const directoryPageEnabled = app.config.chains.getById(
    app.activeChainId()
  )?.directoryPageEnabled;

  return (
    <SubSectionGroup
      isVisible={directoryPageEnabled}
      isActive={!!matchesDirectoryRoute}
      className="DirectoryMenuItem"
      title="Directory"
      containsChildren={false}
      displayData={[]}
      hasDefaultToggle={false}
      onClick={() => navigate('/directory')}
      rightIcon={<CWTag label="New" type="new" iconName="newStar" />}
    />
  );
};

export default DirectoryMenuItem;
