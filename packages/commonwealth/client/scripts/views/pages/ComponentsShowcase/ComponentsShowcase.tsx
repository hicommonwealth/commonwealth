import clsx from 'clsx';
import { groupBy } from 'lodash';
import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import ElevationsShowcase from 'views/pages/ComponentsShowcase/components/Elevations.showcase';
import TooltipsShowcase from 'views/pages/ComponentsShowcase/components/Tooltips.showcase';
import ButtonsShowcase from './components/Buttons.showcase';
import CheckboxShowcase from './components/Checkbox.showcase';

import './ComponentsShowcase.scss';

const NAVBAR_HEIGHT = 56;
const BODY_CLASS_NAME = 'page-body';

export const ComponentPageName = {
  Buttons: 'Buttons',
  Checkbox: 'Checkbox',
  Tooltips: 'Tooltips',
  Elevations: 'Elevations',
};

export const ComponentType = {
  Foundations: 'Foundations',
  Components: 'Components',
};

const alphabetically = (a, b) => a.displayName.localeCompare(b.displayName);

const componentItems = groupBy(
  [
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
    {
      ComponentPage: ButtonsShowcase,
      displayName: ComponentPageName.Buttons,
      type: ComponentType.Components,
    },
    {
      ComponentPage: CheckboxShowcase,
      displayName: ComponentPageName.Checkbox,
      type: ComponentType.Components,
    },
    {
      ComponentPage: TooltipsShowcase,
      displayName: ComponentPageName.Tooltips,
      type: ComponentType.Components,
    },
    {
      ComponentPage: ElevationsShowcase,
      displayName: ComponentPageName.Elevations,
      type: ComponentType.Foundations,
    },
  ].sort(alphabetically),
  ({ type }) => type,
);

const ComponentsShowcase = () => {
  const handleClick = (itemId: string) => {
    const scrollableContainer = document.querySelector(`.${BODY_CLASS_NAME}`);
    const selectedItemElement = document.getElementById(itemId);

    if (scrollableContainer && selectedItemElement) {
      scrollableContainer.scrollTop =
        selectedItemElement.offsetTop - NAVBAR_HEIGHT;
    }
  };

  // Reversed, because first goes "Foundations", then "Components"
  const componentTypesKeys = Object.keys(componentItems).reverse();

  return (
    <div className="ComponentsShowcase">
      {/* Sidebar */}
      <div className="page-sidebar">
        {componentTypesKeys.map((key) => (
          <>
            {/* List Headers */}
            <CWText
              key={key}
              type="caption"
              fontWeight="medium"
              className="list-header"
            >
              {key}
            </CWText>

            {/* List Items */}
            {componentItems[key].map(({ displayName }) => (
              <CWText
                key={displayName}
                className="list-item"
                onClick={() => handleClick(displayName)}
              >
                {displayName}
              </CWText>
            ))}

            <CWDivider className="showcase-sidebar-divider" />
          </>
        ))}
      </div>

      {/* Body */}
      <div className={BODY_CLASS_NAME}>
        {componentTypesKeys.map((key) => (
          <>
            <div className="page-header">
              <CWText type="h3">{key}</CWText>
              <CWText>Our collection of reusable {key.toLowerCase()}</CWText>
              <CWDivider className="showcase-body-divider" />
            </div>

            {componentItems[key].map(({ displayName, ComponentPage }) => (
              <div key={displayName} id={displayName}>
                <CWText className="component-header" type="h4">
                  {displayName}
                </CWText>

                <div className={clsx(displayName, 'component-content')}>
                  <ComponentPage />
                </div>

                <CWDivider className="showcase-body-divider" />
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
};

export default ComponentsShowcase;
