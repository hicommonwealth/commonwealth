import React from 'react';

import 'components/sidebar/sidebar_section.scss';
import { isNotUndefined } from 'helpers/typeGuards';

import { ClassComponent} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  SubSectionAttrs,
} from './types';

class SubSection extends ClassComponent<SubSectionAttrs> {
  view(vnode: ResultNode<SubSectionAttrs>) {
    const {
      isActive,
      isUpdated,
      isVisible,
      onClick,
      rightIcon,
      rowIcon,
      title,
    } = vnode.attrs;

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
  }
}

class SubSectionGroup extends ClassComponent<SectionGroupAttrs> {
  private toggled: boolean;
  private hoverOn: boolean;

  oninit(vnode: ResultNode<SectionGroupAttrs>) {
    const localStorageToggled =
      localStorage.getItem(`${vnode.attrs.title}-toggled`) === 'true';
    this.toggled = vnode.attrs.hasDefaultToggle || localStorageToggled;
  }

  view(vnode: ResultNode<SectionGroupAttrs>) {
    const {
      containsChildren,
      displayData,
      isActive,
      isUpdated,
      isVisible,
      onClick,
      rightIcon,
      title,
    } = vnode.attrs;

    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      if (containsChildren) {
        this.toggled = !this.toggled;
      }

      app.sidebarToggled = false;

      onClick(e, this.toggled);
    };

    const carat = this.toggled ? (
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
      if (this.toggled || this.hoverOn) {
        e.redraw = false;
        e.stopPropagation();
      }
      if (!this.toggled) {
        backgroundColorClass = 'background';
        this.hoverOn = true;
      }
    };

    const mouseLeaveHandler = () => {
      backgroundColorClass =
        isActive && !containsChildren ? 'background' : 'no-background';
      this.hoverOn = false;
    };

    return (
      <div
        className="SubSectionGroup"
        onMouseEnter={(e) => mouseEnterHandler(e)}
        onMouseLeave={() => mouseLeaveHandler()}
      >
        <div
          className={`sub-section-group-title ${
            this.hoverOn ? 'background' : backgroundColorClass
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
          {rightIcon && <div className="right-icon">{rightIcon}</div>}
        </div>
        {containsChildren && this.toggled && (
          <div className="subsections">
            {displayData.map((subsection, i) => (
              <SubSection key={i} {...subsection} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export class SidebarSectionGroup extends ClassComponent<SidebarSectionAttrs> {
  private toggled: boolean;
  private hoverColor: string;

  oninit(vnode: ResultNode<SidebarSectionAttrs>) {
    const localStorageToggled =
      localStorage.getItem(`${vnode.attrs.title}-toggled`) === 'true';
    this.toggled = vnode.attrs.hasDefaultToggle || localStorageToggled;
    this.hoverColor = 'none';
  }

  view(vnode: ResultNode<SidebarSectionAttrs>) {
    const { displayData, extraComponents, onClick, title, toggleDisabled } =
      vnode.attrs;

    const clickHandler = (e, sectionName: string) => {
      if (toggleDisabled) {
        return;
      }

      this.toggled = !this.toggled;

      localStorage.setItem(
        `${sectionName}-toggled`,
        (!!this.toggled).toString()
      );

      if (this.toggled) {
        this.hoverColor = 'none';
      }

      onClick(e, this.toggled);
    };

    const mouseEnterHandler = (e) => {
      if (this.toggled || this.hoverColor) {
        e.redraw = false;
        e.stopPropagation();
      }
    };

    const mouseLeaveHandler = () => {
      this.hoverColor = 'none';
    };

    const carat = this.toggled ? (
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
          onClick={(e) => clickHandler(e, title)}
        >
          {carat}
          <CWText>{title}</CWText>
          {/* rightIcon && <div className="right-icon">{rightIcon}</div> */}
        </div>
        {this.toggled && (
          <div className="sections-container">
            {displayData.map((sectionGroup, i) => (
              <SubSectionGroup {...sectionGroup} key={i} />
            ))}
          </div>
        )}
        {extraComponents}
      </div>
    );
  }
}
