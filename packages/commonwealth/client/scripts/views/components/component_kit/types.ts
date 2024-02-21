import { IconSize } from 'views/components/component_kit/cw_icons/types';
import type ChainInfo from '../../../models/ChainInfo';
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
  CircleSpinner = 'CircleSpinner',
  Collapsible = 'Collapsible',
  CommunityAvatar = 'CommunityAvatar',
  CommunitySelector = 'CommunitySelector',
  ContentPage = 'ContentPage',
  CustomIcon = 'CustomIcon',
  Divider = 'Divider',
  Drawer = 'Drawer',
  Form = 'Form',
  FormSection = 'FormSection',
  FormSteps = 'FormSteps',
  FilterMenu = 'FilterMenu',
  Growl = 'Growl',
  Grid = 'Grid',
  Icon = 'Icon',
  IconButton = 'IconButton',
  Label = 'Label',
  LoadingSpinner = 'LoadingSpinner',
  MessageBanner = 'MessageBanner',
  MobileMenu = 'MobileMenu',
  Modal = 'CWModal',
  ModalSelectButton = 'ModalSelectButton',
  OldTextInput = 'OldTextInput',
  PageLayout = 'PageLayout',
  PopoverMenu = 'PopoverMenu',
  Popover = 'Popover',
  ProgressBar = 'ProgressBar',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  RelatedCommunityCard = 'RelatedCommunityCard',
  Searchbar = 'Searchbar',
  SidebarMenu = 'SidebarMenu',
  Socials = 'Socials',
  Spinner = 'Spinner',
  Tab = 'Tab',
  Table = 'Table',
  Tag = 'Tag',
  Text = 'Text',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  ThreadAction = 'ThreadAction',
  ThreadVoteButton = 'ThreadVoteButton',
  Toggle = 'Toggle',
  Tooltip = 'Tooltip',
  TypeaheadSelectList = 'TypeaheadSelectList',
  Upvote = 'Upvote',
  ValidationText = 'ValidationText',
  WalletOptionRow = 'WalletOptionRow',
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
