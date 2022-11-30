import { ChainInfo } from 'models';
import { IconName } from './cw_icons/cw_icon_lookup';

export enum ComponentType {
  AccountCreationButton = 'AccountCreationButton',
  AddressTooltip = 'AddressTooltip',
  Avatar = 'Avatar',
  AvatarUpload = 'AvatarUpload',
  Banner = 'Banner',
  Breadcrumbs = 'Breadcrumbs',
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
  Checkbox = 'Checkbox',
  Collapsible = 'Collapsible',
  CommunityAvatar = 'CommunityAvatar',
  ContentPage = 'ContentPage',
  CustomIcon = 'CustomIcon',
  Divider = 'Divider',
  EngagementButton = 'EngagementButton',
  ExternalLink = 'ExternalLink',
  GradientButton = 'GradientButton',
  Growl = 'Growl',
  Icon = 'Icon',
  IconButton = 'IconButton',
  Label = 'Label',
  MessageBanner = 'MessageBanner',
  MobileMenu = 'MobileMenu',
  Modal = 'Modal',
  Popover = 'Popover',
  PopoverMenu = 'PopoverMenu',
  ProgressBar = 'ProgressBar',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  SidebarMenu = 'SidebarMenu',
  Spinner = 'Spinner',
  Tab = 'Tab',
  TabBar = 'TabBar',
  Tag = 'Tag',
  Text = 'Text',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  ThreadVoteButton = 'ThreadVoteButton',
  Toggle = 'Toggle',
  ValidationText = 'ValidationText',
  WalletOptionRow = 'WalletOptionRow',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export type DividerMenuItem = { type?: 'divider' };

type HeaderMenuItem = { type?: 'header'; label?: string };

export type DefaultMenuItem = {
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  isSecondary?: boolean;
  label?: string;
  onclick?: (e?: Event) => void;
  type?: 'default';
};

type NotificationMenuItem = {
  hasUnreads?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  label?: string;
  onclick?: (e?: MouseEvent) => void;
  type?: 'notification';
};

export type CommunityMenuItem = {
  community?: ChainInfo;
  label?: string;
  type?: 'community';
};

export type MenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem
  | NotificationMenuItem
  | CommunityMenuItem;
