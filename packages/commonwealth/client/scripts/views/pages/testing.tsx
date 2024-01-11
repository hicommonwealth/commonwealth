import React, { useState } from 'react';

import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import CWGrid from 'views/components/component_kit/new_designs/CWGrid';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

const style = {
  padding: '10px',
  height: '90vh',
  backgroundColor: 'rgba(0,0,0, 0.1)',
};

const TestingPage = () => {
  const [gridLayout, setGridLayout] = useState(true);

  if (gridLayout) {
    return (
      <CWPageLayout>
        <CWGrid>
          <div style={style}>
            <div style={{ marginBottom: '16px' }}>Grid element 1</div>
            <CWCheckbox
              label="Grid layout"
              checked={gridLayout}
              onChange={() => setGridLayout((prevState) => !prevState)}
            />
          </div>
          <div style={style}>Grid element 2</div>
        </CWGrid>
      </CWPageLayout>
    );
  }

  if (!gridLayout) {
    return (
      <CWPageLayout>
        <div style={style}>
          <div style={{ marginBottom: '16px' }}>Block element</div>
          <CWCheckbox
            label="Grid layout"
            checked={gridLayout}
            onChange={() => setGridLayout((prevState) => !prevState)}
          />
        </div>
      </CWPageLayout>
    );
  }
};

export default TestingPage;
