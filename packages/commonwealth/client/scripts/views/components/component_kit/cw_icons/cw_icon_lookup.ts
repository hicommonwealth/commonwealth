import {
  ArchiveTray,
  ArrowBendUpRight,
  ArrowFatDown,
  ArrowFatUp,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowsInSimple,
  ArrowsOutSimple,
  BellSimple,
  BellSimpleRinging,
  BellSimpleSlash,
  BookOpenText,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretRight,
  CaretUp,
  ChatCenteredDots,
  ChatDots,
  Chats,
  Check,
  CheckCircle,
  CircleNotch,
  CirclesThreePlus,
  ClockCounterClockwise,
  CloudArrowUp,
  Code,
  Coins,
  Compass,
  Copy,
  DotsThreeVertical,
  Download,
  Export,
  Eye,
  Flag,
  FunnelSimple,
  Heart,
  House,
  ImageSquare,
  Lightbulb,
  Link,
  ListChecks,
  ListDashes,
  ListNumbers,
  Lock,
  LockKey,
  LockKeyOpen,
  LockOpen,
  MagnifyingGlass,
  Minus,
  Notches,
  NotePencil,
  Notepad,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  PlusCircle,
  PushPin,
  Question,
  Quotes,
  Rows,
  SignOut,
  Sparkle,
  SquaresFour,
  Table,
  TextB,
  TextHOne,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline,
  Timer,
  Trash,
  Trophy,
  TwitterLogo,
  Users,
  UsersThree,
  Warning,
} from '@phosphor-icons/react';
import * as CustomIcons from './cw_custom_icons';
import * as Icons from './cw_icons';
import { withPhosphorIcon } from './cw_phosphor_icons';

export const iconLookup = {
  bold: withPhosphorIcon(TextB),
  italic: withPhosphorIcon(TextItalic),
  underline: withPhosphorIcon(TextUnderline),
  strikethrough: withPhosphorIcon(TextStrikethrough),
  superscript: withPhosphorIcon(TextSuperscript),
  subscript: withPhosphorIcon(TextSubscript),
  listDashes: withPhosphorIcon(ListDashes),
  listNumbers: withPhosphorIcon(ListNumbers),
  listChecks: withPhosphorIcon(ListChecks),
  h1: withPhosphorIcon(TextHOne),
  h2: withPhosphorIcon(TextHTwo),
  h3: withPhosphorIcon(TextHThree),
  quotes: withPhosphorIcon(Quotes),
  table: withPhosphorIcon(Table),
  cloudArrowUp: withPhosphorIcon(CloudArrowUp),
  archiveTrayFilled: Icons.CWArchiveTrayFilled,
  arrowDownBlue500: Icons.CWArrowDownBlue500,
  arrowFatUp: Icons.CWArrowFatUp,
  arrowFatUpNeutral: Icons.CWArrowFatUpNeutral,
  arrowFatUpBlue500: Icons.CWArrowFatUpBlue500,
  arrowFatUpBlue600: Icons.CWArrowFatUpBlue600,
  arrowUpBlue500: Icons.CWArrowUpBlue500,
  arrowUpNeutral400: Icons.CWArrowUpNeutral400,
  arrowSquareOut: withPhosphorIcon(ArrowSquareOut),
  arrowsInSimple: withPhosphorIcon(ArrowsInSimple),
  arrowsOutSimple: withPhosphorIcon(ArrowsOutSimple),
  keyLockOpened: withPhosphorIcon(LockKeyOpen),
  keyLockClosed: withPhosphorIcon(LockKey),
  eye: withPhosphorIcon(Eye),
  export: withPhosphorIcon(Export),
  archiveTray: withPhosphorIcon(ArchiveTray),
  arrowLeft: Icons.CWArrowLeft,
  arrowRight: Icons.CWArrowRight,
  arrowRightPhosphor: withPhosphorIcon(ArrowRight),
  arrowLeftPhosphor: withPhosphorIcon(ArrowLeft),
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
  checkNew: withPhosphorIcon(Check),
  checkCircle: withPhosphorIcon(CheckCircle),
  checkCircleFilled: (props) =>
    withPhosphorIcon(CheckCircle)({ weight: 'fill', ...props }),
  chevronDown: Icons.CWChevronDown,
  chevronLeft: Icons.CWChevronLeft,
  chevronRight: Icons.CWChevronRight,
  chevronUp: Icons.CWChevronUp,
  chats: withPhosphorIcon(Chats),
  circlesThreeplus: withPhosphorIcon(CirclesThreePlus),
  circleNotch: withPhosphorIcon(CircleNotch),
  caretUp: withPhosphorIcon(CaretUp),
  caretDown: withPhosphorIcon(CaretDown),
  caretRight: withPhosphorIcon(CaretRight),
  caretDoubleRight: withPhosphorIcon(CaretDoubleRight),
  caretDoubleLeft: withPhosphorIcon(CaretDoubleLeft),
  clock: Icons.CWClock,
  close: Icons.CWClose,
  cloud: Icons.CWCloud,
  code: withPhosphorIcon(Code),
  coins: withPhosphorIcon(Coins),
  collapse: Icons.CWCollapse,
  commonLogo: Icons.CWCommonLogo,
  comment: withPhosphorIcon(ChatCenteredDots),
  compass: Icons.CWCompass,
  compassPhosphor: withPhosphorIcon(Compass),
  copy: Icons.CWCopy,
  copyNew: withPhosphorIcon(Copy),
  clockCounterClockwise: withPhosphorIcon(ClockCounterClockwise),
  cosmos: Icons.CWCosmos,
  cow: Icons.CWCow,
  curator: Icons.CWCurator,
  delegate: Icons.CWDelegate,
  democraticProposal: Icons.CWDemocraticProposal,
  discord: Icons.CWDiscord,
  discordOld: Icons.CWDiscordLogin, // TODO: possible remove
  dot: Icons.CWDot,
  dots: Icons.CWDots,
  dotsVertical: Icons.CWDotsVertical,
  dotsThreeVertical: withPhosphorIcon(DotsThreeVertical),
  dotsHorizontal: Icons.CWDotsHorizontal,
  downvote: withPhosphorIcon(ArrowFatDown),
  edgeware: Icons.CWEdgeware,
  element: Icons.CWElement,
  envelope: Icons.CWEnvelope,
  ethereum: Icons.CWEthereum,
  etherscan: Icons.CWEtherscan,
  expand: Icons.CWExpand,
  exploreCommunity: Icons.CWExploreCommunities,
  externalLink: Icons.CWExternalLink,
  feedback: Icons.CWFeedback,
  filter: Icons.CWFilter,
  // flag: Icons.CWFlag,
  flag: withPhosphorIcon(Flag),
  funnelSimple: withPhosphorIcon(FunnelSimple),
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
  house: withPhosphorIcon(House),
  imageUpload: Icons.CWImageUpload,
  infoEmpty: Icons.CWInfoEmpty,
  infoFilled: Icons.CWInfoFilled,
  imageSquare: withPhosphorIcon(ImageSquare),
  jar: Icons.CWJar,
  link: Icons.CWLink,
  lightbulb: withPhosphorIcon(Lightbulb),
  linkPhosphor: withPhosphorIcon(Link),
  lock: Icons.CWLock,
  lockedNew: withPhosphorIcon(Lock),
  lockOpenNew: withPhosphorIcon(LockOpen),
  logout: Icons.CWLogout,
  mail: Icons.CWMail,
  magnifyingGlass: withPhosphorIcon(MagnifyingGlass),
  minus: withPhosphorIcon(Minus),
  mute: Icons.CWMute,
  near: Icons.CWNear,
  newStar: Icons.CWNewStar,
  notches: withPhosphorIcon(Notches),
  notePencil: withPhosphorIcon(NotePencil),
  notepad: withPhosphorIcon(Notepad),
  paperPlaneTilt: withPhosphorIcon(PaperPlaneTilt),
  people: Icons.CWPeople,
  peopleNew: withPhosphorIcon(UsersThree),
  person: Icons.CWPerson,
  pencil: withPhosphorIcon(PencilSimple),
  // pin: Icons.CWPin,
  pin: withPhosphorIcon(PushPin),
  plus: Icons.CWPlus,
  plusPhosphor: withPhosphorIcon(Plus),
  plusCircle: Icons.CWPlusCircle,
  plusCirclePhosphor: (props) => withPhosphorIcon(PlusCircle)(props),
  polkadot: Icons.CWPolkadot,
  polygon: Icons.CWPolygon,
  rows: (props) => withPhosphorIcon(Rows)(props),
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
  squaresFour: (props) => withPhosphorIcon(SquaresFour)(props),
  star: Icons.CWStar,
  sun: Icons.CWSun,
  telegram: Icons.CWTelegram,
  trophy: withPhosphorIcon(Trophy),
  timer: withPhosphorIcon(Timer),
  transfer: Icons.CWTransfer,
  // trash: Icons.CWTrash,
  trash: withPhosphorIcon(Trash),
  treasuryProposal: Icons.CWTreasuryProposal,
  trendUp: Icons.CWTrendUp,
  twitter: Icons.CWTwitter,
  twitterNew: Icons.CWTwitterNew,
  twitterOutline: withPhosphorIcon(TwitterLogo),
  twitterX: Icons.CWTwitterX,
  unsubscribe: Icons.CWUnsubscribe,
  upvote: withPhosphorIcon(ArrowFatUp),
  users: withPhosphorIcon(Users),
  vote: Icons.CWVote,
  views: Icons.CWViews,
  wallet: Icons.CWWallet,
  warning: (props) => withPhosphorIcon(Warning)(props),
  website: Icons.CWWebsite,
  write: Icons.CWWrite,
  members: Icons.CWMembers,
  download: withPhosphorIcon(Download),
};

export const customIconLookup = {
  base: CustomIcons.CWBase,
  blast: CustomIcons.CWBlast,
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
  leap: CustomIcons.CWLeap,
  magic: CustomIcons.CWMagic,
  metamask: CustomIcons.CWMetaMask,
  near: CustomIcons.CWNearWallet,
  phantom: CustomIcons.CWPhantom,
  polkadot: CustomIcons.CWPolkadot,
  terrastation: CustomIcons.CWTerraStation2,
  unreads: CustomIcons.CWUnreads,
  walletconnect: CustomIcons.CWWalletConnect,
  'terra-walletconnect': CustomIcons.CWWalletConnect,
  coinbase: CustomIcons.CWCoinbase,
  x: CustomIcons.CWX, // twitter
  apple: CustomIcons.CWApple,
};

export type IconName = keyof typeof iconLookup;
export type CustomIconName = keyof typeof customIconLookup;
