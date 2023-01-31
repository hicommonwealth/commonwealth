export type BaseSidebarAttrs = {
  isActive?: boolean; // Is this the current page
  isUpdated?: boolean; // Does this page have updates (relevant for chat, less so for other sections)
  isVisible?: boolean; // Is this section shown as an option
  onClick?: any;
  onhover?: () => void;
  rightIcon?: React.ReactNode;
  title?: string;
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
  hasDefaultToggle?: boolean;
  displayData?: SectionGroupAttrs[];
  extraComponents?: React.ReactNode;
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
