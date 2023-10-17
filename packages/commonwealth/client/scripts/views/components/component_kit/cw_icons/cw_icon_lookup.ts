import {
  CaretDown,
  CaretUp,
  ChatDots,
  ClockCounterClockwise,
  Heart,
  Sparkle,
  ArchiveTray,
  ArrowBendUpRight,
  ArrowFatDown,
  ArrowFatUp,
  BellSimple,
  BellSimpleRinging,
  BellSimpleSlash,
  ChatCenteredDots,
  Flag,
  LockKey,
  LockKeyOpen,
  PushPin,
  Trash,
  Eye,
  CheckCircle,
  PlusCircle,
  Question,
  Compass,
  PaperPlaneTilt,
  BookOpenText,
  SignOut,
  Link,
  TwitterLogo,
  NotePencil,
  Users,
  Notepad,
} from '@phosphor-icons/react';
import * as CustomIcons from './cw_custom_icons';
import * as Icons from './cw_icons';
import { withPhosphorIcon } from './cw_phosphor_icons';

export const iconLookup = {
  arrowDownBlue500: Icons.CWArrowDownBlue500,
  arrowFatUp: Icons.CWArrowFatUp,
  arrowFatUpNeutral: Icons.CWArrowFatUpNeutral,
  arrowFatUpBlue500: Icons.CWArrowFatUpBlue500,
  arrowFatUpBlue600: Icons.CWArrowFatUpBlue600,
  arrowUpBlue500: Icons.CWArrowUpBlue500,
  arrowUpNeutral400: Icons.CWArrowUpNeutral400,
  keyLockOpened: withPhosphorIcon(LockKeyOpen),
  keyLockClosed: withPhosphorIcon(LockKey),
  eye: withPhosphorIcon(Eye),
  archiveTray: withPhosphorIcon(ArchiveTray),
  arrowLeft: Icons.CWArrowLeft,
  arrowRight: Icons.CWArrowRight,
  backer: Icons.CWBacker,
  badge: Icons.CWBadge,
  bell: withPhosphorIcon(BellSimple),
  bellNew: Icons.CWBellNew,
  bellRinging: withPhosphorIcon(BellSimpleRinging),
  bellMuted: withPhosphorIcon(BellSimpleSlash),
  bookOpenText: withPhosphorIcon(BookOpenText),
  cautionCircle: Icons.CWCautionCircle,
  cautionTriangle: Icons.CWCautionTriangle,
  chatDots: withPhosphorIcon(ChatDots),
  check: Icons.CWCheck,
  checkCircle: withPhosphorIcon(CheckCircle),
  checkCircleFilled: () => withPhosphorIcon(CheckCircle)({ weight: 'fill' }),
  chevronDown: Icons.CWChevronDown,
  chevronLeft: Icons.CWChevronLeft,
  chevronRight: Icons.CWChevronRight,
  chevronUp: Icons.CWChevronUp,
  caretUp: withPhosphorIcon(CaretUp),
  caretDown: withPhosphorIcon(CaretDown),
  clock: Icons.CWClock,
  close: Icons.CWClose,
  cloud: Icons.CWCloud,
  collapse: Icons.CWCollapse,
  commonLogo: Icons.CWCommonLogo,
  comment: withPhosphorIcon(ChatCenteredDots),
  compass: Icons.CWCompass,
  compassPhosphor: withPhosphorIcon(Compass),
  copy: Icons.CWCopy,
  clockCounterClockwise: withPhosphorIcon(ClockCounterClockwise),
  cosmos: Icons.CWCosmos,
  cow: Icons.CWCow,
  curator: Icons.CWCurator,
  delegate: Icons.CWDelegate,
  democraticProposal: Icons.CWDemocraticProposal,
  discord: Icons.CWDiscord,
  discordLogin: Icons.CWDiscordLogin,
  dot: Icons.CWDot,
  dots: Icons.CWDots,
  dotsVertical: Icons.CWDotsVertical,
  downvote: withPhosphorIcon(ArrowFatDown),
  edgeware: Icons.CWEdgeware,
  element: Icons.CWElement,
  envelope: Icons.CWEnvelope,
  ethereum: Icons.CWEthereum,
  expand: Icons.CWExpand,
  exploreCommunity: Icons.CWExploreCommunities,
  externalLink: Icons.CWExternalLink,
  feedback: Icons.CWFeedback,
  filter: Icons.CWFilter,
  // flag: Icons.CWFlag,
  flag: withPhosphorIcon(Flag),
  flame: Icons.CWFlame,
  gear: Icons.CWGear,
  github: Icons.CWGithub,
  octocat: Icons.CWOctocat,
  google: Icons.CWGoogle,
  hamburger: Icons.CWHamburger,
  hash: Icons.CWHash,
  heart: withPhosphorIcon(Heart),
  heartEmpty: Icons.CWHeartEmpty,
  heartFilled: Icons.CWHeartFilled,
  help: Icons.CWHelp,
  home: Icons.CWHome,
  imageUpload: Icons.CWImageUpload,
  infoEmpty: Icons.CWInfoEmpty,
  infoFilled: Icons.CWInfoFilled,
  jar: Icons.CWJar,
  link: Icons.CWLink,
  linkPhosphor: withPhosphorIcon(Link),
  lock: Icons.CWLock,
  logout: Icons.CWLogout,
  mail: Icons.CWMail,
  mute: Icons.CWMute,
  near: Icons.CWNear,
  newStar: Icons.CWNewStar,
  notePencil: withPhosphorIcon(NotePencil),
  notepad: withPhosphorIcon(Notepad),
  paperPlaneTilt: withPhosphorIcon(PaperPlaneTilt),
  people: Icons.CWPeople,
  person: Icons.CWPerson,
  // pin: Icons.CWPin,
  pin: withPhosphorIcon(PushPin),
  plus: Icons.CWPlus,
  plusCircle: Icons.CWPlusCircle,
  plusCirclePhosphor: (props) => withPhosphorIcon(PlusCircle)(props),
  polkadot: Icons.CWPolkadot,
  polygon: Icons.CWPolygon,
  question: withPhosphorIcon(Question),
  search: Icons.CWSearch,
  send: Icons.CWSend,
  // share: Icons.CWShare,
  share: withPhosphorIcon(ArrowBendUpRight),
  share2: Icons.CWShare2,
  sidebarCollapse: Icons.CWSidebarCollapse,
  sidebarExpand: Icons.CWSidebarExpand,
  signOut: withPhosphorIcon(SignOut),
  sparkle: withPhosphorIcon(Sparkle),
  star: Icons.CWStar,
  sun: Icons.CWSun,
  telegram: Icons.CWTelegram,
  transfer: Icons.CWTransfer,
  // trash: Icons.CWTrash,
  trash: withPhosphorIcon(Trash),
  treasuryProposal: Icons.CWTreasuryProposal,
  trendUp: Icons.CWTrendUp,
  twitter: Icons.CWTwitter,
  twitterNew: Icons.CWTwitterNew,
  twitterOutline: withPhosphorIcon(TwitterLogo),
  unsubscribe: Icons.CWUnsubscribe,
  upvote: withPhosphorIcon(ArrowFatUp),
  users: withPhosphorIcon(Users),
  vote: Icons.CWVote,
  views: Icons.CWViews,
  wallet: Icons.CWWallet,
  website: Icons.CWWebsite,
  write: Icons.CWWrite,
};

export const customIconLookup = {
  email: CustomIcons.CWEmail,
  eth: CustomIcons.CWEth,
  cosmos: CustomIcons.CWCosmos,
  nearIcon: CustomIcons.CWNearIcon,
  discordIcon: CustomIcons.CWDiscord,
  githubIcon: CustomIcons.CWGithub,
  twitterIcon: CustomIcons.CWTwitter,
  envelope: CustomIcons.CWEnvelop,
  'keplr-ethereum': CustomIcons.CWKeplr,
  'cosm-metamask': CustomIcons.CWMetaMask,
  keplr: CustomIcons.CWKeplr,
  magic: CustomIcons.CWMagic,
  metamask: CustomIcons.CWMetaMask,
  near: CustomIcons.CWNearWallet,
  phantom: CustomIcons.CWPhantom,
  polkadot: CustomIcons.CWPolkadot,
  ronin: CustomIcons.CWRonin,
  terrastation: CustomIcons.CWTerraStation2,
  unreads: CustomIcons.CWUnreads,
  walletconnect: CustomIcons.CWWalletConnect,
  'terra-walletconnect': CustomIcons.CWWalletConnect,
};

export type IconName = keyof typeof iconLookup;
export type CustomIconName = keyof typeof customIconLookup;
