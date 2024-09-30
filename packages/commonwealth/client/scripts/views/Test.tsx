import React, { useState } from 'react';
import { ScrollContainer } from 'views/components/ScrollContainer/ScrollContainer';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

export const Test = () => {
  const [selected, setSelected] = useState(1);

  return (
    <div style={{ overflow: 'auto' }}>
      <ScrollContainer>
        <CWTabsRow>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((current) => (
            <CWTab
              key={current}
              label={'Tab' + current}
              isSelected={current === selected}
              onClick={() => setSelected(current)}
            />
          ))}
        </CWTabsRow>
      </ScrollContainer>
    </div>
  );
};
