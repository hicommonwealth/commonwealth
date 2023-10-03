import type ChainInfo from '../../../models/ChainInfo';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { IconSize } from 'views/components/component_kit/cw_icons/types';

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
  OldTextInput = 'OldTextInput',
  OldTooltip = 'OldTooltip',
  Popover = 'Popover',
  PopoverMenu = 'PopoverMenu',
  ProgressBar = 'ProgressBar',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  RelatedCommunityCard = 'RelatedCommunityCard',
  Searchbar = 'Searchbar',
  SidebarMenu = 'SidebarMenu',
  Socials = 'Socials',
  Spinner = 'Spinner',
  Tab = 'Tab',
  TabBar = 'TabBar',
  Tag = 'Tag',
  Text = 'Text',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  ThreadAction = 'ThreadAction',
  ThreadVoteButton = 'ThreadVoteButton',
  Toggle = 'Toggle',
  Tooltip = 'Tooltip',
  Upvote = 'Upvote',
  ValidationText = 'ValidationText',
  WalletOptionRow = 'WalletOptionRow',
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
  community?: ChainInfo;
  label?: string | JSX.Element;
  type?: 'community';
};

export type MenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem
  | NotificationMenuItem
  | CommunityMenuItem;
