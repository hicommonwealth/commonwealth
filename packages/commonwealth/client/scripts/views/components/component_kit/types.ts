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

export type BaseStyleProps = {
  disabled?: boolean;
  className?: string;
};

export type DividerMenuItem = { type: 'divider'; className?: string };

export type HeaderMenuItem = {
  type: 'header';
  label?: string | JSX.Element;
  className?: string;
};

export type DefaultMenuItem = {
  disabled?: boolean;
  iconLeft?: IconName;
  iconLeftWeight?: 'fill' | 'bold';
  iconLeftSize?: IconSize;
  iconRight?: IconName;
  iconRightWeight?: 'fill' | 'bold';
  isSecondary?: boolean;
  label?: string | JSX.Element;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  type?: 'default';
  className?: string;
  preventClosing?: boolean;
  isButton?: boolean;
};

export type ComponentMenuItem = {
  type: 'element';
  element: ReactNode;
};

type NotificationMenuItem = {
  hasUnreads?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  label?: string | JSX.Element;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  type?: 'notification';
};

export type CommunityMenuItem = {
  community?: {
    id: string;
    name: string;
    iconUrl: string;
    isStarred: boolean;
  };
  label?: string | JSX.Element;
  type?: 'community';
};

export type MenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem
  | NotificationMenuItem
  | CommunityMenuItem
  | ComponentMenuItem;
