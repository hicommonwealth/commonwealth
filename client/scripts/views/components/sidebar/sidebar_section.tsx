/* @jsx m */

import m from 'mithril';
import { Icon, Icons } from 'construct-ui';

import 'components/sidebar/sidebar_section.scss';

export type SubSectionProps = {
  isActive: boolean; // Is this the current page
  isUpdated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  isVisible: boolean;
  onclick: any;
  onhover?: () => void;
  rightIcon?: m.Component;
  rowIcon?: boolean;
  title: string;
};

class SubSection implements m.ClassComponent<SubSectionProps> {
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

    let titleTextClass = '.title-standard';

    if (isActive) {
      titleTextClass = '.title-active';
    } else if (!isUpdated) {
      titleTextClass = '.title-stale';
    }

    return (
      <div class="SubSection" onclick={(e) => clickHandler(e)}>
        {rowIcon && (
          <div class={titleTextClass}>{m(Icon, { name: Icons.HASH })}</div>
        )}
        <div class={titleTextClass}>{title}</div>]
        {rightIcon && <div class="right-icon">{rightIcon}</div>}
      </div>
    );
  }
}

export type SectionGroupProps = {
  containsChildren: boolean;
  displayData: SubSectionProps[] | null;
  hasDefaultToggle: boolean;
  isActive: boolean; // Is this the current page
  isUpdated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  isVisible: boolean; // Is this section shown as an option
  onclick: any;
  onhover?: () => void;
  rightIcon?: m.Component;
  title: string;
};

class SectionGroup implements m.ClassComponent<SectionGroupProps> {
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

    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      if (containsChildren) {
        this.toggled = !this.toggled;
      }
      onclick(e, this.toggled);
    };

    const carat = this.toggled
      ? m(Icon, {
          name: Icons.CHEVRON_DOWN,
        })
      : m(Icon, {
          name: Icons.CHEVRON_RIGHT,
        });

    let titleTextClass = '.section-title-text-standard';

    if (isActive && !containsChildren) {
      titleTextClass = '.section-title-text-active';
    } else if (!isUpdated) {
      titleTextClass = '.section-title-text-stale';
    }

    let backgroundColor = 'none';

    if (isActive && !containsChildren) {
      backgroundColor = '#EDE7FF';
    }

    const mouseEnterHandler = (e) => {
      if (this.toggled || this.hoverOn) {
        e.redraw = false;
        e.stopPropagation();
      }
      if (!this.toggled) {
        backgroundColor = '#EDE7FF';
        this.hoverOn = true;
      }
    };

    const mouseLeaveHandler = () => {
      backgroundColor = isActive && !containsChildren ? '#EDE7FF' : 'none';
      this.hoverOn = false;
    };

    return (
      <div
        class="SectionGroup"
        onmouseenter={(e) => mouseEnterHandler(e)}
        onmouseleave={() => mouseLeaveHandler()}
      >
        <div
          class="SectionGroupTitle"
          onclick={(e) => clickHandler(e)}
          style={`background-color: ${
            this.hoverOn ? '#EDE7FF' : backgroundColor
          }`}
        >
          {containsChildren ? (
            <div class="carat">{carat}</div>
          ) : (
            <div class="no-carat" />
          )}
          <div class={titleTextClass}>{title}</div>
          {rightIcon && <div class="right-icon">{rightIcon}</div>}
          {containsChildren && this.toggled && (
            <div class="subsections">
              {displayData.map((subsection) => (
                <SubSection {...subsection} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export type SidebarSectionProps = {
  hasDefaultToggle: boolean;
  displayData: SectionGroupProps[];
  extraComponents?: m.Vnode;
  isActive: boolean;
  onclick: any;
  onhover?: () => void;
  rightIcon?: m.Vnode;
  title: string;
  toggleDisabled?: boolean;
};

export class SidebarSection implements m.ClassComponent<SidebarSectionProps> {
  private toggled: boolean;
  private hoverColor: string;

  oninit(vnode) {
    this.toggled = vnode.attrs.defaultToggle;
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

    const clickHandler = (e) => {
      if (toggleDisabled) {
        return;
      }

      this.toggled = !this.toggled;

      if (this.toggled) {
        this.hoverColor = 'none';
      }

      onclick(e, this.toggled);
    };

    const mouseEnterHandler = (e) => {
      if (this.toggled || this.hoverColor) {
        e.redraw = false;
        e.stopPropagation();
      }
      if (!this.toggled) {
        this.hoverColor = '#EDE7FF';
      }
    };

    const mouseLeaveHandler = () => {
      this.hoverColor = 'none';
    };

    const carat = this.toggled
      ? m(Icon, {
          name: Icons.CHEVRON_DOWN,
        })
      : m(Icon, {
          name: Icons.CHEVRON_RIGHT,
        });

    return (
      <div
        class="SidebarSection"
        onmouseenter={(e) => mouseEnterHandler(e)}
        onmouseleave={() => mouseLeaveHandler()}
        style={`background-color: ${this.hoverColor}`}
      >
        <div class="SidebarTitle" onclick={(e) => clickHandler(e)}>
          <div class="title-text">{title}</div>
          {rightIcon && <div class="right-icon">{rightIcon}</div>}
          <div class="toggle-icon">{carat}</div>
        </div>
        {this.toggled && (
          <div class="section-groups">
            {displayData.map((sectionGroup) => (
              <SectionGroup {...sectionGroup} />
            ))}
          </div>
        )}
        {extraComponents}
      </div>
    );
  }
}
