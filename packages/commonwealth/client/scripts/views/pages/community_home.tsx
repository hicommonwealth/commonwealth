import React from 'react';

import 'pages/community_home.scss';

import CommunityHomeProfile from '../components/CommunityHomeProfile'

type CommunityHomeAttrs = {
  profileId: string;
};

const CommunityHome = (props: CommunityHomeAttrs) => {
  return <CommunityHomeProfile />;
};

export default CommunityHome;