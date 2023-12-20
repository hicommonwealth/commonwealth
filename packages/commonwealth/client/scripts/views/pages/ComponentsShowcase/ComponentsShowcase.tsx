import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';

import './ComponentsShowcase.scss';

const NAVBAR_HEIGHT = 56;
const BODY_CLASS_NAME = 'page-body';

const ComponentsShowcase = () => {
  const handleClick = (itemId: string) => {
    const scrollableContainer = document.querySelector(`.${BODY_CLASS_NAME}`);
    const selectedItemElement = document.getElementById(itemId);

    if (scrollableContainer && selectedItemElement) {
      scrollableContainer.scrollTop =
        selectedItemElement.offsetTop - NAVBAR_HEIGHT;
    }
  };

  return (
    <div className="ComponentsShowcase">
      <div className="page-sidebar">
        <CWText type="caption" fontWeight="medium" className="list-header">
          Foundations
        </CWText>
        {Array(20)
          .fill('')
          .map((_, index) => (
            <CWText
              key={index}
              className="list-item"
              onClick={() => handleClick(String(index))}
            >
              Component {index}
            </CWText>
          ))}

        <CWDivider className="showcase-sidebar-divider" />

        <CWText type="caption" fontWeight="medium" className="list-header">
          Components
        </CWText>
        {Array(20)
          .fill('')
          .map((_, index) => (
            <CWText key={index} className="list-item">
              Component {index}
            </CWText>
          ))}
      </div>

      <div className={BODY_CLASS_NAME}>
        <div className="page-header">
          <CWText type="h3">Components</CWText>
          <CWText>Our collection of reusable components</CWText>
        </div>

        <CWDivider className="showcase-body-divider" />

        <div>
          {Array(200)
            .fill('')
            .map((_, index) => (
              <div key={index} id={String(index)}>
                Component {index}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ComponentsShowcase;
