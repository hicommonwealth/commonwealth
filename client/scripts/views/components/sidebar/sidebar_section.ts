import { Icon, Icons } from 'construct-ui';
import m from 'mithril';

export interface SubSectionProps {
  title: string;
  isVisible: boolean;
  isActive: boolean; // Is this the current page
  isUpdated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  onclick: Function;
  onhover?: Function;
  rowIcon?: boolean;
}

export interface SectionGroupProps {
  title: string;
  containsChildren: boolean;
  defaultToggle: boolean;
  isVisible: boolean; // Is this section shown as an option
  isActive: boolean; // Is this the current page
  isUpdated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  onclick: Function;
  onhover?: Function;
  displayData: SubSectionProps[] | null;
}

export interface SidebarSectionProps {
  title: string;
  defaultToggle: boolean;
  isActive: boolean;
  onclick: Function;
  onhover?: Function;
  displayData: SectionGroupProps[];
  toggleDisabled?: boolean;
}

const SubSection: m.Component<SubSectionProps, {backgroundColor: string}> = {
  oninit: (vnode) => {
    vnode.state.backgroundColor = vnode.attrs.isActive ? '#EDE7FF' : 'none';
  },
  view: (vnode) => {
    const {title, isVisible, isActive, onclick, rowIcon, isUpdated} = vnode.attrs;
    const { backgroundColor } = vnode.state;
    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      onclick(e);
    }

    let titleTextClass = '.title-standard';
    if (isActive) {
      titleTextClass = '.title-active'
    } else if (!isUpdated) {
      titleTextClass = '.title-stale'
    }

    const mouseEnterHandler = (e) => {
      vnode.state.backgroundColor = '#EDE7FF';
    }

    const mouseLeaveHandler = (e) => {
      vnode.state.backgroundColor = (isActive) ? '#EDE7FF' : 'none';
    }

    return m('.SubSection', {
        onclick: (e) => clickHandler(e),
        style: `background-color: ${backgroundColor}`,
        onmouseenter: (e) => mouseEnterHandler(e),
        onmouseleave: (e) => mouseLeaveHandler(e),
      }, [
        rowIcon && m(titleTextClass, [m(Icon, {name: Icons.HASH})]),
        m(titleTextClass, title),
      ])
    }
}

const SectionGroup: m.Component<SectionGroupProps, {toggled: boolean, hoverOn: boolean}> = {
  oninit: (vnode) => {
    vnode.state.toggled = vnode.attrs.defaultToggle;
  },
  view: (vnode) => {
    const {title, containsChildren, displayData, isVisible, isUpdated, isActive, onclick, onhover} = vnode.attrs;
    const {toggled} = vnode.state;

    if (!isVisible) {
      return;
    }

    const clickHandler = (e) => {
      if (containsChildren) {
        vnode.state.toggled = !toggled;
      }
      onclick(e, vnode.state.toggled);
    }

    const carat = toggled
      ? m(Icon, { name: Icons.CHEVRON_DOWN })
      : m(Icon, { name: Icons.CHEVRON_RIGHT });

    let titleTextClass = '.section-title-text-standard';
    if (isActive && !containsChildren) {
      titleTextClass = '.section-title-text-active'
    } else if (!isUpdated) {
      titleTextClass = '.section-title-text-stale'
    }

    let backgroundColor = 'none';
    if (isActive && !containsChildren) {
      backgroundColor = '#EDE7FF'
    }

    const mouseEnterHandler = (e) => {
    if (!toggled) {
    backgroundColor = '#EDE7FF';
    vnode.state.hoverOn = true;
    }
    }

    const mouseLeaveHandler = (e) => {
    backgroundColor = (isActive && !containsChildren) ? '#EDE7FF' : 'none';
    vnode.state.hoverOn = false;
    }
    return m('.SectionGroup', {
      onmouseenter: (e) => mouseEnterHandler(e),
      onmouseleave: (e) => mouseLeaveHandler(e),
    }, [
      m('.SectionGroupTitle', {
        onclick: (e) => clickHandler(e),
        style: `background-color: ${vnode.state.hoverOn ? '#EDE7FF' : backgroundColor}`,
      }, [
        containsChildren ? m('.carat', carat) : m('.no-carat'),
        m(titleTextClass, title),
      ]),
      containsChildren && toggled
      && m('.subsections', [
        displayData.map((subsection) => (
          m(SubSection, {...subsection})
        ))
      ])
    ])
  }
}


const SidebarSection: m.Component<SidebarSectionProps, {toggled: boolean, hoverColor: string}> = {
  oninit: (vnode) => {
    vnode.state.toggled = vnode.attrs.defaultToggle;
    vnode.state.hoverColor = 'none';
  },
  view: (vnode) => {
    const { title, onclick, toggleDisabled, displayData } = vnode.attrs;
    const { toggled, hoverColor } = vnode.state;

    const clickHandler = (e) => {
      if (toggleDisabled) {
        return;
      }
      vnode.state.toggled = !toggled;
      if (vnode.state.toggled) {
        vnode.state.hoverColor = 'none';
      }
      onclick(e, vnode.state.toggled);
    }

    const mouseEnterHandler = (e) => {
      if (!toggled) {
        vnode.state.hoverColor = '#EDE7FF';
      }
    }

    const mouseLeaveHandler = (e) => {
      vnode.state.hoverColor = 'none';
    }

    const carat = toggled
      ? m(Icon, { name: Icons.CHEVRON_DOWN })
      : m(Icon, { name: Icons.CHEVRON_RIGHT });

    return m('.SidebarSection', {
      onmouseenter: (e) => mouseEnterHandler(e),
      onmouseleave: (e) => mouseLeaveHandler(e),
      style: `background-color: ${hoverColor}`
      }, [
      m('.SidebarTitle', {
        onclick: (e) => clickHandler(e),
      }, [
        m('.title-text', title),
        m('.toggle-icon', carat)
      ]),
      toggled && m('.section-groups', [
        displayData.map((sectionGroup) => (
          m(SectionGroup, {...sectionGroup})
        ))
      ])
    ])
  }
};



export default SidebarSection;