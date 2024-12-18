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

export type MenuItem = {
  type: 'default' | 'header' | 'divider' | 'submenu' | 'notification' | 'community' | 'component';
  label?: string | JSX.Element;
  className?: string;
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
  items?: MenuItem[]; // For submenu type
  hasUnreads?: boolean; // For notification type
  component?: ReactNode; // For component type
  community?: {
    id: string;
    name: string;
    iconUrl: string;
    isStarred: boolean;
  }; // For community type
};

export type PopoverMenuItem = MenuItem;

export type DropdownItemType<T extends string | number = string | number> = {
  label: string | JSX.Element;
  value: T;
  selected?: boolean;
  className?: string;
};
