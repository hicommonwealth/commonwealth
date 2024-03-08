import React from 'react';
import { CWCollapsible } from 'views/components/component_kit/cw_collapsible';
import { CWText } from 'views/components/component_kit/cw_text';

const CollapsiblesShowcase = () => {
  return (
    <>
      <CWCollapsible
        headerContent={<CWText>Header content</CWText>}
        collapsibleContent={<CWText>Body content</CWText>}
      />
    </>
  );
};

export default CollapsiblesShowcase;
