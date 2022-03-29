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
  contains_children: boolean;
  default_toggle: boolean;
  is_visible: boolean; // Is this section shown as an option
  isActive: boolean; // Is this the current page
  isUpdated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  onclick: Function;
  onhover?: Function;
  display_data: SubSectionProps[] | null;
}

export interface SidebarSectionProps {
  title: string;
  defaultToggle: boolean;
  isActive: boolean;
  onclick: Function;
  onhover?: Function;
  display_data: SectionGroupProps[];
  toggle_disabled?: boolean;
}

const SubSection: m.Component<SubSectionProps, { background_color: string }> = {
  oninit: (vnode) => {
    vnode.state.background_color = vnode.attrs.isActive ? '#EDE7FF' : 'none';
  },
  view: (vnode) => {
    const { title, isVisible, isActive, onclick, rowIcon, isUpdated } =
      vnode.attrs;
    const { background_color } = vnode.state;
    if (!isVisible) {
      return;
    }

    const click_handler = (e) => {
      onclick(e);
    };

    let titleTextClass = '.title-standard';
    if (isActive) {
      titleTextClass = '.title-active';
    } else if (!isUpdated) {
      titleTextClass = '.title-stale';
    }

    const mouseEnterHandler = (e) => {
      vnode.state.background_color = '#EDE7FF';
    };

    const mouseLeaveHandler = (e) => {
      vnode.state.background_color = isActive ? '#EDE7FF' : 'none';
    };

    return m(
      '.SubSection',
      {
        onclick: (e) => click_handler(e),
        style: `background-color: ${background_color}`,
        onmouseenter: (e) => mouse_enter_handler(e),
        onmouseleave: (e) => mouseLeaveHandler(e),
      },
      [
        rowIcon && m(titleTextClass, [m(Icon, { name: Icons.HASH })]),
        m(titleTextClass, title),
      ]
    );
  },
};

const SectionGroup: m.Component<
  SectionGroupProps,
  { toggled: boolean; hover_on: boolean }
> = {
  oninit: (vnode) => {
    vnode.state.toggled = vnode.attrs.default_toggle;
  },
  view: (vnode) => {
    const {
      title,
      containsChildren,
      displayData,
      is_visible,
      isUpdated,
      isActive,
      onclick,
      onhover,
    } = vnode.attrs;
    const { toggled } = vnode.state;

    if (!is_visible) {
      return;
    }

    const click_handler = (e) => {
      if (containsChildren) {
        vnode.state.toggled = !toggled;
      }
      onclick(e, vnode.state.toggled);
    };

    const carat = toggled
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

    let background_color = 'none';
    if (isActive && !containsChildren) {
      background_color = '#EDE7FF';
    }

    const mouse_enter_handler = (e) => {
      if (!toggled) {
        background_color = '#EDE7FF';
        vnode.state.hover_on = true;
      }
    };

    const mouseLeaveHandler = (e) => {
      background_color = isActive && !containsChildren ? '#EDE7FF' : 'none';
      vnode.state.hover_on = false;
    };

    return m(
      '.SectionGroup',
      {
        onmouseenter: mouseEnterHandler,
        onmouseleave: (mouseLeaveHandler,
      },
      [
        m(
          '.SectionGroupTitle',
          {
            onclick: (e) => click_handler(e),
            style: `background-color: ${
              vnode.state.hover_on ? '#EDE7FF' : background_color
            }`,
          },
          [
            containsChildren ? m('.carat', carat) : m('.no-carat'),
            m(titleTextClass, title),
          ]
        ),
        containsChildren &&
          toggled &&
          m('.subsections', [
            displayData.map((subsection) => m(SubSection, { ...subsection })),
          ]),
      ]
    );
  },
};

const SidebarSection: m.Component<
  SidebarSectionProps,
  { toggled: boolean; hover_color: string }
> = {
  oninit: (vnode) => {
    vnode.state.toggled = vnode.attrs.defaultToggle;
    vnode.state.hover_color = 'none';
  },
  view: (vnode) => {
    const { title, onclick, toggle_disabled, display_data } = vnode.attrs;
    const { toggled, hover_color } = vnode.state;

    const click_handler = (e) => {
      if (toggle_disabled) {
        return;
      }
      vnode.state.toggled = !toggled;
      if (vnode.state.toggled) {
        vnode.state.hover_color = 'none';
      }
      onclick(e, vnode.state.toggled);
    };

    const mouseEnterHandler = (e) => {
      if (!toggled) {
        vnode.state.hover_color = '#EDE7FF';
      }
    };

    const mouseLeaveHandler = (e) => {
      vnode.state.hover_color = 'none';
    };

    const carat = toggled
      ? m(Icon, {
          name: Icons.CHEVRON_DOWN,
        })
      : m(Icon, {
          name: Icons.CHEVRON_RIGHT,
        });

    return m(
      '.SidebarSection',
      {
        onmouseenter: (e) => mouseEnterHandler(e),
        onmouseleave: (e) => mouseLeaveHandler(e),
        style: `background-color: ${hover_color}`,
      },
      [
        m(
          '.SidebarTitle',
          {
            onclick: (e) => click_handler(e),
          },
          [m('.title-text', title), m('.toggle-icon', carat)]
        ),
        toggled &&
          m('.section-groups', [
            display_data.map((section_group) =>
              m(SectionGroup, { ...section_group })
            ),
          ]),
      ]
    );
  },
};

export default SidebarSection;
