import React from 'react';
import MembersSection from './MembersSection';
import GroupsSection from './GroupsSection';

const CommunityMembersPage = () => {
  // TEMP: consider it a feature flag, remove this after https://github.com/hicommonwealth/commonwealth/issues/4989
  const showGroupSection = window.location.search.includes('tab=groups');

  if (showGroupSection) {
    return <GroupsSection />;
  }

  return <MembersSection />;
};

export default CommunityMembersPage;
