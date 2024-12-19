import clsx from 'clsx';
import React from 'react';

import './sidebar_section.scss';

import { isNotUndefined } from 'helpers/typeGuards';
import useSidebarStore from 'state/ui/sidebar';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  SubSectionAttrs,
} from './types';

const AboutIcon = () => {
  return (
    <div className="about-icon-container">
      <CWTooltip
        content="About Common"
        placement="bottom"
        renderTrigger={(handleInteraction) => (
          <CWIconButton
            iconButtonTheme="neutral"
            iconName="infoEmpty"
            onClick={() => window.open('https://landing.common.xyz', '_blank')}
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />
    </div>
  );
};

const SubSection = (props: SubSectionAttrs) => {
  const { isActive, isUpdated, isVisible, onClick, rightIcon, rowIcon, title } =
    props;

  if (!isVisible) {
    return;
  }

  const clickHandler = (e) => {
    onClick(e);
  };

  let titleTextClass = '';

  if (isActive) {
    titleTextClass = 'title-active';
  } else if (!isUpdated) {
    titleTextClass = 'title-stale';
  }

  return (
    <div
      className={`SubSection${isActive ? ' active' : ''}`}
      onClick={(e) => clickHandler(e)}
    >
      {isNotUndefined(rowIcon) && <CWIcon iconName="hash" iconSize="small" />}
      <div className={titleTextClass} title={title}>
        {title}
      </div>
      {isNotUndefined(rightIcon) && (
        <div className="right-icon">{rightIcon}</div>
      )}
    </div>
  );
};

// eslint-disable-next-line react/no-multi-comp
export const SubSectionGroup = (props: SectionGroupAttrs) => {
  const {
    containsChildren,
    displayData,
    hasDefaultToggle,
    isActive,
    isUpdated,
    isVisible,
    onClick,
    rightIcon,
    title,
    className,
  } = props;

  const { setMenu, menuName, menuVisible } = useSidebarStore();
  const [toggled, setToggled] = React.useState<boolean>(
    hasDefaultToggle || localStorage.getItem(`${title}-toggled`) === 'true',
  );
  const [hoverOn, setHoverOn] = React.useState<boolean>(false);

  if (!isVisible) {
    return;
  }

  const clickHandler = (e) => {
    if (containsChildren) {
      setToggled(!toggled);
    }
    setMenu({ name: menuName, isVisible: menuVisible });

    onClick(e, toggled);
  };

  const carat = toggled ? (
    <CWIcon iconName="chevronDown" iconSize="small" />
  ) : (
    <CWIcon iconName="chevronRight" iconSize="small" />
  );

  let titleTextClass = '';

  if (isActive && !containsChildren) {
    titleTextClass = 'section-title-text-active';
  } else if (!isUpdated) {
    titleTextClass = 'section-title-text-stale';
  }

  let backgroundColorClass = 'no-background';

  if (isActive && !containsChildren) {
    backgroundColorClass = 'background';
  }

  const mouseEnterHandler = (e) => {
    if (toggled || hoverOn) {
      e.redraw = false;
      e.stopPropagation();
    }
    if (!toggled) {
      backgroundColorClass = 'background';
      setHoverOn(true);
    }
  };

  const mouseLeaveHandler = () => {
    backgroundColorClass =
      isActive && !containsChildren ? 'background' : 'no-background';
    setHoverOn(false);
  };

  return (
    <div
      className={clsx('SubSectionGroup', className)}
      onMouseEnter={(e) => mouseEnterHandler(e)}
      onMouseLeave={() => mouseLeaveHandler()}
    >
      <div
        className={`sub-section-group-title ${
          hoverOn ? 'background' : backgroundColorClass
        }`}
        onClick={(e) => clickHandler(e)}
      >
        {containsChildren ? (
          <div className="carat">{carat}</div>
        ) : (
          <div className="no-carat" />
        )}
        <CWText type="b2" className={`title-text ${titleTextClass}`}>
          {title}
        </CWText>
        <div className="right-icon">{rightIcon}</div>
      </div>
      {containsChildren && toggled && (
        <div className="subsections">
          {/* @ts-expect-error StrictNullChecks*/}
          {displayData.map((subsection, i) => (
            <SubSection key={i} {...subsection} />
          ))}
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line react/no-multi-comp
export const SidebarSectionGroup = (props: SidebarSectionAttrs) => {
  const {
    displayData,
    extraComponents,
    hasDefaultToggle,
    onClick,
    title,
    toggleDisabled,
  } = props;

  const [toggled, setToggled] = React.useState<boolean>(
    hasDefaultToggle || localStorage.getItem(`${title}-toggled`) === 'true',
  );
  const [hoverColor, setHoverColor] = React.useState<string>();

  const clickHandler = (e, sectionName: string) => {
    if (toggleDisabled) {
      return;
    }

    setToggled(!toggled);

    localStorage.setItem(`${sectionName}-toggled`, (!toggled).toString());

    if (toggled) {
      setHoverColor('none');
    }

    onClick(e, toggled);
  };

  const mouseEnterHandler = (e) => {
    if (toggled || hoverColor) {
      e.redraw = false;
      e.stopPropagation();
    }
  };

  const mouseLeaveHandler = () => {
    setHoverColor('none');
  };

  const carat = toggled ? (
    <CWIcon iconName="chevronDown" iconSize="small" />
  ) : (
    <CWIcon iconName="chevronRight" iconSize="small" />
  );

  return (
    <div
      className="SidebarSectionGroup"
      onMouseEnter={(e) => mouseEnterHandler(e)}
      onMouseLeave={() => mouseLeaveHandler()}
    >
      <div
        className="section-group-title-container"
        // @ts-expect-error <StrictNullChecks/>
        onClick={(e) => clickHandler(e, title)}
      >
        {carat}
        <CWText>{title}</CWText>
      </div>
      {toggled && (
        <div className="sections-container">
          {/* @ts-expect-error StrictNullChecks*/}
          {displayData.map((sectionGroup, i) => (
            <SubSectionGroup {...sectionGroup} key={i} />
          ))}
        </div>
      )}
      {extraComponents}
      <AboutIcon />
    </div>
  );
};
