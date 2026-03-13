import React, { useRef } from 'react';
import './CommunityHomePage.scss';
import CommunityHomePageContent from './CommunityHomePageContent';
import useCommunityHomePageData from './useCommunityHomePageData';

const CommunityHomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const data = useCommunityHomePageData();

  return <CommunityHomePageContent containerRef={containerRef} {...data} />;
};

export default CommunityHomePage;
