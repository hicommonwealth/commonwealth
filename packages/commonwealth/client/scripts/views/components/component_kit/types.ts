// import type { ChainInfo } from 'models';
import type ChainInfo from '../../../models/ChainInfo';
import type { IconName } from './cw_icons/cw_icon_lookup';

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
  Form = 'Form',
  FormSection = 'FormSection',
  FilterMenu = 'FilterMenu',
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
  Socials = 'Socials',
  Spinner = 'Spinner',
  Tab = 'Tab',
  TabBar = 'TabBar',
  Tag = 'Tag',
  Text = 'Text',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  ThreadVoteButton = 'ThreadVoteButton',
  Toggle = 'Toggle',
  Tooltip = 'Tooltip',
  ValidationText = 'ValidationText',
  WalletOptionRow = 'WalletOptionRow',
}

export type BaseStyleProps = {
  disabled?: boolean;
  className?: string;
};

export type DividerMenuItem = { type: 'divider' };

export type HeaderMenuItem = { type: 'header'; label?: string };

export type DefaultMenuItem = {
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  isSecondary?: boolean;
  label?: string;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  type?: 'default';
};

type NotificationMenuItem = {
  hasUnreads?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  label?: string;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
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
