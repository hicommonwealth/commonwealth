import m from 'mithril';

export type BaseSidebarAttrs = {
  isActive: boolean; // Is this the current page
  isUpdated?: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  isVisible?: boolean; // Is this section shown as an option
  onclick: any;
  onhover?: () => void;
  rightIcon?: m.Vnode;
  title: string;
  className?: string;
};

export type SubSectionAttrs = {
  rowIcon?: boolean;
} & BaseSidebarAttrs;

export type SectionGroupAttrs = {
  containsChildren: boolean;
  displayData: SubSectionAttrs[] | null;
  hasDefaultToggle: boolean;
} & BaseSidebarAttrs;

export type SidebarSectionAttrs = {
  hasDefaultToggle: boolean;
  displayData: SectionGroupAttrs[];
  extraComponents?: m.Vnode;
  toggleDisabled?: boolean;
} & BaseSidebarAttrs;

export type ToggleTree = {
  toggledState: boolean;
  children: {
    [child: string]: {
      toggledState: boolean;
      children: {
        [child: string]: {
          toggledState: boolean;
        };
      };
    };
  };
};
