import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import CWTab from 'views/components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from 'views/components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './ExplorePage.scss';
import IdeaLaunchpad from './IdeaLaunchpad';
import type { ExploreTabView } from './useExploreData';

type ExplorePageShellProps = {
  activeTab: string;
  children: React.ReactNode;
  containerRef: React.MutableRefObject<HTMLElement | undefined>;
  onSearchTextChange: (value: string) => void;
  onTabClick: (tabValue: string) => void;
  searchText: string;
  tabViews: ExploreTabView[];
};

const ExplorePageShell = ({
  activeTab,
  children,
  containerRef,
  onSearchTextChange,
  onTabClick,
  searchText,
  tabViews,
}: ExplorePageShellProps) => (
  // @ts-expect-error <StrictNullChecks/>
  <CWPageLayout ref={containerRef} className="ExplorePageLayout">
    <div className="ExplorePage">
      <div className="header-section">
        <IdeaLaunchpad />

        <CWTextInput
          placeholder={`Search ${activeTab}`}
          value={searchText}
          onInput={(event) => onSearchTextChange(event?.target?.value || '')}
          fullWidth
          iconLeft={<CWIcon iconName="search" />}
        />

        <CWTabsRow className="explore-tabs-row">
          {tabViews.map((tab) => (
            <CWTab
              key={tab.value}
              label={tab.label}
              isSelected={activeTab === tab.value}
              onClick={() => onTabClick(tab.value)}
            />
          ))}
        </CWTabsRow>
      </div>

      {children}
    </div>
  </CWPageLayout>
);

export default ExplorePageShell;
