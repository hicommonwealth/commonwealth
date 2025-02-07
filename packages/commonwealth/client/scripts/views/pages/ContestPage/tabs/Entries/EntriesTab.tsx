import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import './EntriesTab.scss';

const EntriesTab = () => {
  return (
    <div className="EntriesTab">
      <CWText type="h3" fontWeight="semiBold">
        Entries
      </CWText>
      {/* Add entries content here */}
    </div>
  );
};

export default EntriesTab;
