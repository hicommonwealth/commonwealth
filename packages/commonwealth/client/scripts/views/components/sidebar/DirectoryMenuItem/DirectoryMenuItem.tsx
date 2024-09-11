import React from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { SubSectionGroup } from '../sidebar_section';

import { useGetCommunityByIdQuery } from 'state/api/communities';
import './DirectoryMenuItem.scss';

const DirectoryMenuItem = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const matchesDirectoryRoute = matchRoutes(
    [{ path: '/directory' }, { path: ':scope/directory' }],
    location,
  );

  const communityId = app.activeChainId() || '';
  const { data: community, isLoading } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  if (isLoading || !community) return;

  return (
    <SubSectionGroup
      isVisible={community?.directory_page_enabled}
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
