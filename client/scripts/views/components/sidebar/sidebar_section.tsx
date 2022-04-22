/* @jsx m */

import m from 'mithril';

import 'components/sidebar/sidebar_section.scss';

import { isNotUndefined } from 'helpers/typeGuards';
import {
  SubSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
} from './types';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

class SubSection implements m.ClassComponent<SubSectionAttrs> {
  view(vnode) {
    const {
      isActive,
      isUpdated,
      isVisible,
      onclick,
      rightIcon,
      rowIcon,
      title,
    } = vnode.attrs;

    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      onclick(e);
    };

    let titleTextClass = '';

    if (isActive) {
      titleTextClass = 'title-active';
    } else if (!isUpdated) {
      titleTextClass = 'title-stale';
    }

    return (
      <div
        class={`SubSection${isActive ? ' active' : ''}`}
        onclick={(e) => clickHandler(e)}
      >
        {isNotUndefined(rowIcon) && <CWIcon iconName="hash" iconSize="small" />}
        <div class={titleTextClass}>{title}</div>
        {isNotUndefined(rightIcon) && <div class="right-icon">{rightIcon}</div>}
      </div>
    );
  }
}
class SubSectionGroup implements m.ClassComponent<SectionGroupAttrs> {
  private toggled: boolean;
  private hoverOn: boolean;

  oninit(vnode) {
    this.toggled = vnode.attrs.hasDefaultToggle;
  }

  view(vnode) {
    const {
      containsChildren,
      displayData,
      isActive,
      isUpdated,
      isVisible,
      onclick,
      rightIcon,
      title,
    } = vnode.attrs;
    const { toggled } = this;

    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      if (containsChildren) {
        this.toggled = !toggled;
      }
      onclick(e, this.toggled);
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
      if (toggled || this.hoverOn) {
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
        class="SubSectionGroup"
        onmouseenter={(e) => mouseEnterHandler(e)}
        onmouseleave={() => mouseLeaveHandler()}
      >
        <div
          class={`SubSectionGroupTitle ${
            this.hoverOn ? 'background' : backgroundColorClass
          }`}
          onclick={(e) => clickHandler(e)}
        >
          {containsChildren ? (
            <div class="carat">{carat}</div>
          ) : (
            <div class="no-carat" />
          )}
          <div title={title} class={`title-text ${titleTextClass}`}>
            {title}
          </div>
          {rightIcon && <div class="right-icon">{rightIcon}</div>}
        </div>
        {containsChildren && toggled && (
          <div class="subsections">
            {displayData.map((subsection) => (
              <SubSection {...subsection} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export class SidebarSectionGroup
  implements m.ClassComponent<SidebarSectionAttrs>
{
  private toggled: boolean;
  private hoverColor: string;

  oninit(vnode) {
    this.toggled = vnode.attrs.hasDefaultToggle;
    this.hoverColor = 'none';
  }

  view(vnode) {
    const {
      displayData,
      extraComponents,
      onclick,
      rightIcon,
      title,
      toggleDisabled,
    } = vnode.attrs;
    const { toggled, hoverColor } = this;

    const clickHandler = (e) => {
      if (toggleDisabled) {
        return;
      }

      this.toggled = !toggled;

      if (this.toggled) {
        this.hoverColor = 'none';
      }

      onclick(e, this.toggled);
    };

    const mouseEnterHandler = (e) => {
      if (toggled || this.hoverColor) {
        e.redraw = false;
        e.stopPropagation();
      }
      if (!toggled) {
        this.hoverColor = '#EDE7FF';
      }
    };

    const mouseLeaveHandler = () => {
      this.hoverColor = 'none';
    };

    const carat = toggled ? (
      <CWIcon iconName="chevronDown" iconSize="small" />
    ) : (
      <CWIcon iconName="chevronRight" iconSize="small" />
    );

    return (
      <div
        class="SidebarSectionGroup"
        onmouseenter={(e) => mouseEnterHandler(e)}
        onmouseleave={() => mouseLeaveHandler()}
        style={`background-color: ${hoverColor}`}
      >
        <div
          class="section-group-title-container"
          onclick={(e) => clickHandler(e)}
        >
          <div class="title-text">{title}</div>
          {rightIcon && <div class="right-icon">{rightIcon}</div>}
          {carat}
        </div>
        {this.toggled && (
          <div class="sections-container">
            {displayData.map((sectionGroup) => (
              <SubSectionGroup {...sectionGroup} />
            ))}
          </div>
        )}
        {extraComponents}
      </div>
    );
  }
}
