import { ReactNode } from 'react';
import { IconSize } from 'views/components/component_kit/cw_icons/types';
import type { IconName } from './cw_icons/cw_icon_lookup';

export enum ComponentType {
  AccountCreationButton = 'AccountCreationButton',
  Avatar = 'Avatar',
  AvatarUpload = 'AvatarUpload',
  Banner = 'Banner',
  Breadcrumbs = 'Breadcrumbs',
  Button = 'Button',
  Card = 'Card',
  Checkbox = 'Checkbox',
  CircleButton = 'CircleButton',
  CircleMultiplySpinner = 'CircleMultiplySpinner',
  CircleRingSpinner = 'CircleRingSpinner',
  Collapsible = 'Collapsible',
  CommunityAvatar = 'CommunityAvatar',
  CommunitySelector = 'CommunitySelector',
  ContentPage = 'ContentPage',
  CustomIcon = 'CustomIcon',
  Divider = 'Divider',
  Drawer = 'Drawer',
  FormSteps = 'FormSteps',
  FilterMenu = 'FilterMenu',
  Growl = 'Growl',
  Grid = 'Grid',
  Icon = 'Icon',
  IconButton = 'IconButton',
  Label = 'Label',
  MessageBanner = 'MessageBanner',
  Modal = 'CWModal',
  OldTextInput = 'OldTextInput',
  PageLayout = 'PageLayout',
  Pagination = 'Pagination',
  PopoverMenu = 'PopoverMenu',
  Popover = 'Popover',
  ProgressBar = 'ProgressBar',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  RadioPanel = 'RadioPanel',
  RelatedCommunityCard = 'RelatedCommunityCard',
  Searchbar = 'Searchbar',
  SidebarMenu = 'SidebarMenu',
  Spinner = 'Spinner',
  Tab = 'Tab',
  Table = 'Table',
  Tag = 'Tag',
  Text = 'Text',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  ThreadAction = 'ThreadAction',
  Toggle = 'Toggle',
  Tooltip = 'Tooltip',
  TypeaheadSelectList = 'TypeaheadSelectList',
  Upvote = 'Upvote',
  ValidationText = 'ValidationText',
  SelectList = 'SelectList',
}

export type BaseMenuItem = {
  label: string | JSX.Element;
  type:
    | 'default'
    | 'header'
    | 'divider'
    | 'submenu'
    | 'notification'
    | 'community'
    | 'component';
  className?: string;
  key?: string | number;
};

export type DividerMenuItem = BaseMenuItem & {
  type: 'divider';
};

export type HeaderMenuItem = BaseMenuItem & {
  type: 'header';
};

export type DefaultMenuItem = BaseMenuItem & {
  type: 'default';
  disabled?: boolean;
  iconLeft?: IconName;
  iconLeftWeight?: 'fill' | 'bold';
  iconLeftSize?: IconSize;
  iconRight?: IconName;
  isSecondary?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  preventClosing?: boolean;
  isButton?: boolean;
  selected?: boolean;
};

export type ComponentMenuItem = BaseMenuItem & {
  type: 'component';
  component: ReactNode;
};

export type NotificationMenuItem = BaseMenuItem & {
  type: 'notification';
  hasUnreads?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
};

export type CommunityMenuItem = BaseMenuItem & {
  type: 'community';
  community?: {
    id: string;
    name: string;
    iconUrl: string;
    isStarred: boolean;
  };
};

export type SubmenuMenuItem = BaseMenuItem & {
  type: 'submenu';
  items: MenuItem[];
};

export type DropdownItemType<T extends string | number = string | number> = {
  label: string | JSX.Element;
  value: T;
  selected?: boolean;
  className?: string;
};

export type PopoverMenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem
  | ComponentMenuItem
  | NotificationMenuItem
  | CommunityMenuItem
  | SubmenuMenuItem;

export type MenuItem = PopoverMenuItem;
