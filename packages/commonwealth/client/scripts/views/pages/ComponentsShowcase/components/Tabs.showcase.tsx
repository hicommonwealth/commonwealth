import React, { useState } from 'react';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

const tabsList = [
  { label: 'First', id: 0 },
  { label: 'Second is very long so it gets truncated at some point', id: 1 },
  {
    label: 'Third is with visual addition',
    id: 2,
    showTag: true,
    iconLeft: 'eye',
  },
  { label: 'Fourth - disabled', id: 3, disabled: true },
];

const TabsShowcase = () => {
  const [currentTab, setCurrentTab] = useState(tabsList[0].id);
  const [currentBoxedTab, setCurrentBoxedTab] = useState(tabsList[0].id);

  return (
    <>
      <CWText type="h5">Regular</CWText>
      <div className="flex-row">
        <CWTabsRow>
          {tabsList.map((tab) => (
            <CWTab
              key={tab.id}
              label={tab.label}
              isDisabled={tab.disabled}
              showTag={tab.showTag}
              isSelected={currentTab === tab.id}
              onClick={() => setCurrentTab(tab.id)}
            />
          ))}
        </CWTabsRow>
      </div>

      <CWText type="h5">Boxed</CWText>
      <div className="flex-row">
        <CWTabsRow boxed={true}>
          {tabsList.map((tab) => (
            <CWTab
              boxed={true}
              key={tab.id}
              label={tab.label}
              isDisabled={tab.disabled}
              iconLeft={tab.iconLeft as IconName}
              isSelected={currentBoxedTab === tab.id}
              onClick={() => setCurrentBoxedTab(tab.id)}
            />
          ))}
        </CWTabsRow>
      </div>
    </>
  );
};

export default TabsShowcase;
