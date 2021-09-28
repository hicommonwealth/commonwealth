import m from 'mithril';
import 'components/component_kit/component_listing.scss';
import { notifySuccess } from 'controllers/app/notifications';
import {
  Breadcrumb,
  BreadcrumbItem,
  Icon,
  Icons,
  Input,
  TextArea,
  Button,
  ButtonGroup,
  Card,
  Callout,
  Form,
  FormGroup,
  FormLabel,
  List,
  ListItem,
  MenuItem,
  PopoverMenu,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  Spinner,
  Tag,
  Tabs,
  TabItem,
  Table,
} from 'construct-ui';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  LikesIcon,
  ReplyIcon,
  ViewsIcon,
  ShareIcon,
  AccountIcon,
  CopyIcon,
  CreateIcon,
  NotificationIcon,
  XIcon,
  SearchIcon,
  ElementIcon,
  DiscordIcon,
  TelegramIcon,
  GithubIcon,
  IconSize,
  ExternalLinkIcon,
  PinIcon,
  IconIntent,
  WebsiteIcon,
} from './icons';
import {
  ButtonIntent,
  ExternalLinkElement,
  FaceliftButton,
  FaceliftButtonGroup,
  Justify,
  LinkStyle,
  FaceliftRadioGroup,
  ButtonSize,
  EngagementButton,
} from './buttons';
import { TextInput, TextInputStatus } from './forms';

const displayColors = (hexList) => {
  return Object.entries(hexList).map(([k, v]) => {
    return m('.hex-row', [
      m('.hex-name', k),
      m('.hex-sample', { style: `background: ${v};` }),
    ]);
  });
};

const displayGradients = (gradientNames: string[]) => {
  return gradientNames.map((gradient) => {
    return m('.gradient-row', [
      m('.gradient-name', gradient),
      m('.gradient-sample', { class: gradient }),
    ]);
  });
};

const displayIcons = (headerText: string, iconList) => {
  return m('.icon-gallery', [
    m('h2', headerText),
    Object.entries(iconList).map(([k, v]) => {
      return m('.icon-row', [m('.icon-name', k), v]);
    }),
  ]);
};

const ComponentListing: m.Component<{}, { radioGroupSelected; activeTab }> = {
  view: (vnode) => {
    return m('.ComponentListing', [
      m('h1', 'Redesign Colors'),
      m(
        '.hex-listing',
        displayColors({
          Black: '#000000',
          DarkGray: '#333333',
          MidiGray: '#666666',
          LiteGray: '#999999',
          DisableGray: '#DDDDDD',
          BackgroundGray: '#F4F4F4',
          DarkPurp: '#4723AD',
          MidiPurp: '#9075DC',
          LitePurp: '#C7B9EF',
          XLitePurp: '#F7F4FF',
          PurpBlue: '#6300FF',
          PurpBlueLite: '#F3EBFF',
          HypeRed: '#FF002E',
          Pinky: '#FFAFBE',
          FleshPink: '#FFEBEE',
          DarkGreen: '#008676',
          CarribGreen: '#00C0A9',
          FoamGreen: '#B4F1EA',
          MintGreen: '#F3FFF9',
          CreamYellow: '#FFFBA1',
        })
      ),
      m('h1', 'Redesign Gradients'),
      m(
        '.gradient-listing',
        displayGradients([
          'rainbow-gradient-horizontal',
          'rainbow-gradient-diagonal',
          'shadow-gradient',
        ])
      ),
      m('h1', 'Redesign Icons'),
      m('.icon-listing', [
        displayIcons('14x14', {
          ArrowDownIcon: m(ArrowDownIcon, {
            size: IconSize.SM,
            intent: IconIntent.Secondary,
            disabled: false,
          }),
          ArrowRightIcon: m(ArrowRightIcon, {
            size: IconSize.SM,
            intent: IconIntent.Secondary,
            disabled: false,
          }),
          ViewsIcon: m(ViewsIcon, {
            size: IconSize.SM,
            intent: IconIntent.Secondary,
            disabled: true,
          }),
          LikesIcon: m(LikesIcon, {
            size: IconSize.SM,
            intent: IconIntent.Secondary,
            disabled: true,
          }),
          ReplyIcon: m(ReplyIcon, {
            size: IconSize.SM,
            intent: IconIntent.Secondary,
            disabled: true,
          }),
          ExternalLinkIcon: m(ExternalLinkIcon, {
            size: IconSize.SM,
          }),
        }),
        // search, pin, create, notification, account
        displayIcons('20x20', {
          ShareIcon: m(ShareIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          SubscribeIcon: m(NotificationIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          CreateIcon: m(CreateIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          LikesIcon: m(LikesIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          ReplyIcon: m(ReplyIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          SearchIcon: m(SearchIcon, {
            size: IconSize.MD,
            intent: IconIntent.Secondary,
          }),
          PinIcon: m(PinIcon, {
            size: IconSize.MD,
            intent: IconIntent.Secondary,
          }),
          NotificationIcon: m(NotificationIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          AccountIcon: m(AccountIcon, {
            size: IconSize.MD,
            intent: IconIntent.Primary,
          }),
          // FilterIcon: m(FilterIcon),
        }),
        displayIcons('28x28', {
          CopyIcon: m(CopyIcon, {
            size: IconSize.LG,
            intent: IconIntent.Secondary,
          }),
          XIcon: m(XIcon, {
            size: IconSize.LG,
            intent: IconIntent.Secondary,
          }),
          AccountIcon: m(AccountIcon, {
            size: IconSize.LG,
            intent: IconIntent.Primary,
          }),
          NotificationIcon: m(NotificationIcon, {
            size: IconSize.LG,
            intent: IconIntent.Primary,
          }),
        }),
        displayIcons('Social', {
          ElementIcon: m(ElementIcon),
          DiscordIcon: m(DiscordIcon),
          TelegramIcon: m(TelegramIcon),
          GithubIcon: m(GithubIcon),
          WebsiteIcon: m(WebsiteIcon),
        }),
      ]),
      m('h1', 'Redesign Buttons'),
      m(
        '.button-gallery',
        {
          style: 'max-width: 500px;',
        },
        [
          m(FaceliftButton, {
            intent: ButtonIntent.Primary,
            label: 'Primary',
            onclick: () => notifySuccess('Button clicked!'),
            disabled: false,
          }),
          m(FaceliftButton, {
            intent: ButtonIntent.Primary,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
            disabled: true,
          }),
          m(FaceliftButton, {
            intent: ButtonIntent.Secondary,
            label: 'Secondary',
            onclick: () => notifySuccess('Button clicked!'),
            disabled: false,
          }),
          m(FaceliftButton, {
            intent: ButtonIntent.Secondary,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
            disabled: true,
          }),
        ]
      ),
      m('.button-gallery', [
        m(FaceliftButtonGroup, {
          secondaryLabel: 'Button',
          primaryLabel: 'Group',
          primaryOnClick: () => notifySuccess('Primary clicked!'),
          secondaryOnClick: () => notifySuccess('Secondary clicked!'),
          justify: Justify.Left,
        }),
        m(FaceliftButtonGroup, {
          secondaryLabel: 'Center',
          primaryLabel: 'Justified',
          primaryOnClick: () => notifySuccess('Primary clicked!'),
          secondaryOnClick: () => notifySuccess('Secondary clicked!'),
          justify: Justify.Center,
        }),
        m(FaceliftButtonGroup, {
          secondaryLabel: 'Right',
          primaryLabel: 'Justified',
          primaryOnClick: () => notifySuccess('Primary clicked!'),
          secondaryOnClick: () => notifySuccess('Secondary clicked!'),
          justify: Justify.Right,
        }),
      ]),
      m(
        '.button-gallery',
        {
          style: 'max-width: 420px;',
        },
        [
          m(ExternalLinkElement, {
            label: 'Button external link',
            target: 'https://edgewa.re/',
            style: LinkStyle.Button,
          }),
          m(ExternalLinkElement, {
            label: 'Inline external link',
            target: 'https://edgewa.re/',
            style: LinkStyle.Inline,
          }),
        ]
      ),
      m(
        '.button-gallery',
        {
          style: 'max-width: 420px;',
        },
        [
          m(FaceliftRadioGroup, {
            values: ['This', 'Is', 'A', 'Radio', 'Group'],
            labels: ['This', 'Is', 'A', 'Radio', 'Group'],
            defaultValue: 'This',
            name: 'RadioGroup',
            onchange: (e) => notifySuccess(`"${e.target.value}" selected`),
          }),
        ]
      ),
      m(
        '.button-gallery',
        {
          style: 'max-width: 600px;',
        },
        [
          m(EngagementButton, {
            size: ButtonSize.SM,
            label: 'Small',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(EngagementButton, {
            size: ButtonSize.LG,
            label: 'Big',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(EngagementButton, {
            size: ButtonSize.SM,
            label: 'Small',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(EngagementButton, {
            size: ButtonSize.LG,
            label: 'Big',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          }),
        ]
      ),
      m('h1', 'Form Fields'),
      m(
        '.form-gallery',
        {
          style: 'max-width: 600px;',
        },
        [
          m(TextInput, {
            name: 'Form field',
            oninput: (e) => null,
            inputValidationFn: (val: string): [TextInputStatus, string] => {
              if (val.match(/[^A-Za-z]/)) {
                return [TextInputStatus.Error, 'Must enter characters A-Z'];
              } else {
                return [TextInputStatus.Validate, 'Input validated'];
              }
            },
            label: 'This input only accepts A-Z',
            placeholder: 'Placeholder',
          }),
          m(TextInput, {
            name: 'Text field',
            oninput: (e) => null,
            label: 'No status message or error validation',
            placeholder: 'Placeholder',
          }),
        ]
      ),
      m('h1', 'Construct UI'),
      // buttons and inputs
      m('.gallery', [
        m(Button, {
          label: 'Default',
          intent: 'none',
          rounded: true,
        }),
        m(Button, {
          label: 'Primary',
          intent: 'primary',
          rounded: true,
        }),
        m(Button, {
          label: 'Positive',
          intent: 'positive',
          rounded: true,
        }),
        m(Button, {
          label: 'Negative',
          intent: 'negative',
          rounded: true,
        }),
      ]),
      m('.gallery', [
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          rounded: true,
        }),
        m(Button, {
          label: 'Cancel',
          intent: 'none',
          rounded: true,
        }),
      ]),
      m('.gallery', [
        m(Button, {
          label: 'Basic',
          basic: true,
          rounded: true,
        }),
        m(Button, {
          label: 'Outlined',
          outlined: true,
          rounded: true,
        }),
        m(Button, {
          label: 'Compact',
          compact: true,
          rounded: true,
        }),
        m(Button, {
          label: 'Disabled',
          disabled: true,
          rounded: true,
        }),
        m(Button, {
          label: 'Label',
          sublabel: 'Sublabel',
          rounded: true,
        }),
        m(Button, {
          label: 'Loading',
          loading: true,
          rounded: true,
        }),
      ]),
      m('.gallery', [
        m(ButtonGroup, [
          m(Button, {
            iconLeft: Icons.COPY,
            label: 'Copy',
          }),
          m(Button, {
            iconLeft: Icons.SETTINGS,
            label: 'Settings',
          }),
          m(Button, {
            iconLeft: Icons.LINK,
            iconRight: Icons.CHEVRON_DOWN,
            label: 'Link',
          }),
        ]),
      ]),
      m('.gallery', [
        m(Button, {
          label: 'Extra small',
          intent: 'primary',
          size: 'xs',
        }),
        m(Button, {
          label: 'Small',
          intent: 'primary',
          size: 'sm',
        }),
        m(Button, {
          label: 'Default',
          intent: 'primary',
          size: 'default',
        }),
        m(Button, {
          label: 'Large',
          intent: 'primary',
          size: 'lg',
        }),
        m(Button, {
          label: 'Extra large',
          intent: 'primary',
          size: 'xl',
        }),
      ]),

      // checkbox
      m('.gallery', [
        m(Checkbox, {
          defaultChecked: true,
          label: 'Checkbox',
        }),
        m(Checkbox, {
          defaultIndeterminate: true,
          label: 'Checkbox',
        }),
        m(Checkbox, {
          defaultChecked: false,
          label: 'Checkbox',
        }),
        m(Checkbox, {
          defaultChecked: true,
          label: 'Checkbox (disabled)',
          disabled: true,
        }),
        m(Checkbox, {
          defaultChecked: true,
          label: 'Checkbox (read only)',
          readonly: true,
        }),
        m(Checkbox, {
          defaultChecked: true,
          label: 'Checkbox (small)',
          size: 'sm',
        }),
        m(Checkbox, {
          defaultChecked: true,
          label: 'Checkbox (primary)',
          intent: 'primary',
        }),
      ]),

      // radio
      m('.gallery', [
        m(Radio, {
          label: 'Radio button',
        }),
        m(Radio, {
          label: 'Radio button',
        }),
        m(Radio, {
          label: 'Radio button (disabled)',
          disabled: true,
        }),
        m(Radio, {
          label: 'Radio button (read only)',
          readonly: true,
        }),
        m(Radio, {
          label: 'Radio button (primary)',
          intent: 'primary',
        }),
        m(Radio, {
          label: 'Radio button (small)',
          size: 'sm',
        }),
      ]),

      // switch
      m('.gallery', [
        m(Switch, {
          label: 'Switch',
        }),
        m(Switch, {
          label: 'Switch (disabled)',
          disabled: true,
        }),
        m(Switch, {
          label: 'Switch (read only)',
          readonly: true,
        }),
        m(Switch, {
          label: 'Switch (primary)',
          intent: 'primary',
        }),
        m(Switch, {
          label: 'Switch (small)',
          size: 'sm',
        }),
      ]),

      // breadcrumb
      m(
        Breadcrumb,
        {
          size: 'default',
          seperator: m(Icon, { name: Icons.CHEVRON_RIGHT }),
        },
        [
          m(BreadcrumbItem, { href: '#' }, m(Icon, { name: Icons.HOME })),
          m(BreadcrumbItem, { href: '#' }, 'Application'),
          m(BreadcrumbItem, 'Section 1'),
        ]
      ),

      m('div', [
        m(Tag, { size: 'xs', label: 'Extra small' }),
        m(Tag, { size: 'sm', label: 'Small' }),
        m(Tag, { size: 'default', label: 'Default' }),
        m(Tag, { size: 'lg', label: 'Large' }),
        m(Tag, { size: 'xl', label: 'Extra large' }),
      ]),
      m('div', [
        m(Tag, { rounded: true, size: 'xs', label: 'Extra small' }),
        m(Tag, { rounded: true, size: 'sm', label: 'Small' }),
        m(Tag, { rounded: true, size: 'default', label: 'Default' }),
        m(Tag, { rounded: true, size: 'lg', label: 'Large' }),
        m(Tag, { rounded: true, size: 'xl', label: 'Extra large' }),
      ]),
      m('div', [
        m(Tag, { intent: 'primary', size: 'xs', label: 'Extra small' }),
        m(Tag, { intent: 'primary', size: 'sm', label: 'Small' }),
        m(Tag, { intent: 'primary', size: 'default', label: 'Default' }),
        m(Tag, { intent: 'primary', size: 'lg', label: 'Large' }),
        m(Tag, { intent: 'primary', size: 'xl', label: 'Extra large' }),
      ]),
      m('div', [
        m(Tag, {
          rounded: true,
          size: 'xs',
          label: [m(Icon, { name: Icons.LOCK }), ' Extra small'],
        }),
        m(Tag, {
          rounded: true,
          size: 'sm',
          label: [m(Icon, { name: Icons.LOCK }), ' Small'],
        }),
        m(Tag, {
          rounded: true,
          size: 'default',
          label: [m(Icon, { name: Icons.LOCK }), ' Default'],
        }),
        m(Tag, {
          rounded: true,
          size: 'lg',
          label: [m(Icon, { name: Icons.LOCK }), ' Large'],
        }),
        m(Tag, {
          rounded: true,
          size: 'xl',
          label: [m(Icon, { name: Icons.LOCK }), ' Extra large'],
        }),
      ]),

      // callout
      m('div', [
        m(Callout, {
          header: 'Callout header',
          content:
            'Commodo maecenas elit vivamus volutpat urna ridiculus mauris aptent tellus etiam varius sodales',
          icon: Icons.ALERT_CIRCLE,
          size: 'default',
          intent: 'primary',
        }),
      ]),
      m('div', [
        m(Callout, {
          header: 'Callout header',
          content:
            'Commodo maecenas elit vivamus volutpat urna ridiculus mauris aptent tellus etiam varius sodales',
          size: 'sm',
          intent: 'none',
        }),
      ]),

      // card
      m('div', [
        m(
          Card,
          {
            elevation: 0,
            fluid: true,
            interactive: true,
            size: 'default',
            style: 'min-width: 300px',
          },
          [m('h4', 'Card title'), m('div', 'Card content')]
        ),
      ]),
      m('div', [
        m(
          Card,
          {
            elevation: 0,
            size: 'default',
            style: 'min-width: 300px',
          },
          [m('h4', 'Card title'), m('div', 'Card content')]
        ),
      ]),

      // form
      m('div', [
        m(Form, { gutter: 15 }, [
          m(FormGroup, [
            m(FormLabel, { for: 'username' }, 'Username'),
            m(Input, {
              contentLeft: m(Icon, { name: Icons.USER }),
              id: 'username',
              name: 'username',
              placeholder: 'Username...',
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'password' }, 'Password'),
            m(Input, {
              contentLeft: m(Icon, { name: Icons.LOCK }),
              id: 'password',
              name: 'password',
              placeholder: 'Password...',
            }),
          ]),
        ]),
      ]),

      // form in card
      m('div', [
        m(Card, [
          m(Form, { gutter: 15 }, [
            m(FormGroup, [
              m(FormLabel, { for: 'name' }, 'Name'),
              m(Input, {
                id: 'name',
                name: 'name',
                placeholder: 'Name...',
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, { for: 'bio' }, 'Bio'),
              m(TextArea, {
                id: 'bio',
                name: 'bio',
                placeholder: 'Bio...',
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, { for: 'privacy' }, 'Privacy'),
              m(RadioGroup, {
                options: ['Public', 'Private'],
                name: 'privacy',
                onchange: (e) => {
                  vnode.state.radioGroupSelected = (
                    e.currentTarget as HTMLInputElement
                  ).value;
                },
                value: vnode.state.radioGroupSelected,
              }),
            ]),
          ]),
        ]),
      ]),

      // list
      m('div', [
        m(
          List,
          ['List item 1', 'List item 2', 'List item 3', 'List item 4'].map(
            (item) =>
              m(ListItem, {
                contentLeft: m(Icon, { name: Icons.LINK }),
                contentRight: m(PopoverMenu, {
                  closeOnContentClick: true,
                  content: [
                    m(MenuItem, {
                      iconLeft: Icons.EDIT,
                      label: 'Edit',
                    }),
                    m(MenuItem, {
                      iconLeft: Icons.TRASH_2,
                      label: 'Delete',
                      intent: 'negative',
                    }),
                  ],
                  trigger: m(Button, {
                    iconLeft: Icons.MORE_HORIZONTAL,
                    size: 'xs',
                  }),
                  position: 'bottom-end',
                }),
                label: item,
              })
          )
        ),
      ]),

      // tabs
      m(
        Tabs,
        {
          align: 'left',
          bordered: true,
          fluid: false,
          size: 'default',
        },
        [
          ['Accounts', 'Projects', 'Settings'].map((item) =>
            m(TabItem, {
              label: [
                item === 'Settings' &&
                  m(Icon, {
                    name: Icons.SETTINGS,
                    style: 'margin-right: 5px',
                  }),
                item,
              ],
              active:
                vnode.state.activeTab === item ||
                (!vnode.state.activeTab && item === 'Accounts'),
              onclick: () => {
                vnode.state.activeTab = item;
              },
            })
          ),
        ]
      ),
      m(
        Tabs,
        {
          align: 'center',
          bordered: true,
          fluid: false,
          size: 'default',
        },
        [
          ['Accounts', 'Projects', 'Settings'].map((item) =>
            m(TabItem, {
              label: [
                item === 'Settings' &&
                  m(Icon, {
                    name: Icons.SETTINGS,
                    style: 'margin-right: 5px',
                  }),
                item,
              ],
              active:
                vnode.state.activeTab === item ||
                (!vnode.state.activeTab && item === 'Accounts'),
              onclick: () => {
                vnode.state.activeTab = item;
              },
            })
          ),
        ]
      ),

      // table
      m('div', [
        m(
          Table,
          {
            bordered: false,
            interactive: true,
            striped: false,
          },
          [
            m('tr', [m('th', 'Heading 1'), m('th', 'Heading 2')]),
            m('tr', [m('td', 'Cell 1'), m('td', 'Cell 2')]),
            m('tr', [m('td', 'Cell 1'), m('td', 'Cell 2')]),
            m('tr', [m('td', 'Cell 1'), m('td', 'Cell 2')]),
          ]
        ),
      ]),

      // spinner
      m(Card, [m(Spinner, { active: true, fill: true })]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, {
          active: true,
          fill: true,
          size: 'xs',
          message: 'Extra small',
        }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'sm', message: 'Small' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, {
          active: true,
          fill: true,
          size: 'default',
          message: 'Default',
        }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'lg', message: 'Large' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, {
          active: true,
          fill: true,
          size: 'xl',
          message: 'Extra large',
        }),
      ]),
    ]);
  },
};

export default ComponentListing;
