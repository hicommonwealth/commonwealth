import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import { componentItems } from './componentsList';
import { alphabetically, pascalCaseToNormalText } from './utils';

import './ComponentsShowcase.scss';

const NAVBAR_HEIGHT = 56;
const BREADCRUMBS_HEIGHT = 40;
const BODY_CLASS_NAME = 'page-body';

const ComponentsShowcase = () => {
  const handleClick = (itemId: string) => {
    const scrollableContainer = document.querySelector(`.${BODY_CLASS_NAME}`);
    const selectedItemElement = document.getElementById(itemId);

    if (scrollableContainer && selectedItemElement) {
      scrollableContainer.scrollTop =
        selectedItemElement.offsetTop - NAVBAR_HEIGHT - BREADCRUMBS_HEIGHT;
    }
  };

  const sortedComponentItems = componentItems.sort(alphabetically);
  const groupedComponentItems = _.groupBy(
    sortedComponentItems,
    ({ type }) => type,
  );
  // Reversed, because first goes "Foundations", then "Components"
  const componentTypesKeys = Object.keys(groupedComponentItems).reverse();

  return (
    <CWPageLayout>
      <div className="ComponentsShowcase">
        {/* Sidebar */}
        <div className="page-sidebar">
          {componentTypesKeys.map((key) => (
            <React.Fragment key={key}>
              {/* List Headers */}
              <CWText
                type="caption"
                fontWeight="medium"
                className="list-header"
              >
                {key}
              </CWText>

              {/* List Items */}
              {groupedComponentItems[key].map(({ displayName }) => (
                <CWText
                  key={displayName}
                  className="list-item"
                  onClick={() => handleClick(displayName)}
                >
                  {pascalCaseToNormalText(displayName)}
                </CWText>
              ))}

              <CWDivider className="showcase-sidebar-divider" />
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className={BODY_CLASS_NAME}>
          {componentTypesKeys.map((key) => (
            <React.Fragment key={key}>
              <div className="page-header">
                <CWText type="h3">{key}</CWText>
                <CWText>Our collection of reusable {key.toLowerCase()}</CWText>
                <CWDivider className="showcase-body-divider" />
              </div>

              {groupedComponentItems[key].map(
                ({ displayName, ComponentPage }) => (
                  <div key={displayName} id={displayName}>
                    <CWText className="component-header" type="h4">
                      {pascalCaseToNormalText(displayName).toUpperCase()}
                    </CWText>

                    <div className={clsx(displayName, 'component-content')}>
                      <ComponentPage />
                    </div>

                    <CWDivider className="showcase-body-divider" />
                  </div>
                ),
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default ComponentsShowcase;
