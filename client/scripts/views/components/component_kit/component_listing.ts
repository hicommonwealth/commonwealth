import m from 'mithril';
import 'components/component_kit/component_listing.scss';
import { notifySuccess } from 'controllers/app/notifications';
import {
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
import { TextInput, TextInputStatus } from './forms';
import { FaceliftCard } from './cards';
import { CWButton } from './cw_button';
import { CWGradientButton } from './cw_gradient_button';
import { CWButtonGroup } from './cw_button_group';
import { CWExternalLink } from './cw_external_link';
import { CWRadioGroup } from './cw_radio_group';
import { CWEngagementButton } from './cw_engagement_button';
import { CWIcon } from './cw_icons/cw_icon';

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
      m('.icon-gallery', [
        [
          m(
            '.icon-row',
            'Primary Small',
            m(CWIcon, {
              iconName: 'views',
              iconSize: 'small',
            })
          ),
        ],
        [
          m(
            '.icon-row',
            'Primary Medium',
            m(CWIcon, {
              iconName: 'views',
            })
          ),
        ],
        [
          m(
            '.icon-row',
            'Primary Large',
            m(CWIcon, {
              iconName: 'views',
              iconSize: 'large',
            })
          ),
        ],
        [
          m(
            '.icon-row',
            'Secondary Large',
            m(CWIcon, {
              iconName: 'views',
              iconSize: 'large',
              iconType: 'secondary',
            })
          ),
        ],
        [
          m(
            '.icon-row',
            'Disabled Large',
            m(CWIcon, {
              iconName: 'views',
              iconSize: 'large',
              disabled: true,
            })
          ),
        ],
      ]),
      m('h1', 'Redesign Buttons'),
      m(
        '.button-gallery',
        {
          style: 'max-width: 500px;',
        },
        [
          m(CWButton, {
            label: 'Primary',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWButton, {
            disabled: true,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWButton, {
            buttonType: 'secondary',
            label: 'Secondary',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWButton, {
            buttonType: 'secondary',
            disabled: true,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWGradientButton, {
            label: 'Primary',
            onclick: () => notifySuccess('Button clicked!'),
          }),
        ]
      ),
      m('.button-gallery', [
        m(CWButtonGroup, {
          children: [
            m(CWButton, {
              label: 'One',
              onclick: () => notifySuccess('One clicked!'),
            }),
            m(CWButton, {
              label: 'Two',
              onclick: () => notifySuccess('Two clicked!'),
            }),
            m(CWButton, {
              label: 'Three',
              onclick: () => notifySuccess('Three clicked!'),
            }),
            m(CWButton, {
              label: 'Four',
              onclick: () => notifySuccess('Four clicked!'),
            }),
          ],
        }),
      ]),
      m(
        '.button-gallery',
        {
          style: 'max-width: 420px;',
        },
        [
          m(CWExternalLink, {
            label: 'Button external link',
            target: 'https://edgewa.re/',
            linkType: 'button',
          }),
          m(CWExternalLink, {
            label: 'Inline external link',
            target: 'https://edgewa.re/',
            linkType: 'inline',
          }),
        ]
      ),
      m(
        '.button-gallery',
        {
          style: 'max-width: 420px;',
        },
        [
          m(CWRadioGroup, {
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
          m(CWEngagementButton, {
            buttonSize: 'sm',
            label: 'Small',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWEngagementButton, {
            buttonSize: 'lg',
            label: 'Big',
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWEngagementButton, {
            buttonSize: 'sm',
            label: 'Small',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          }),
          m(CWEngagementButton, {
            buttonSize: 'lg',
            label: 'Big',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          }),
        ]
      ),
      m('h1', 'Cards'),
      m('.card-gallery', [
        m(
          FaceliftCard,
          {
            elevation: 1,
            interactive: true,
            fluid: false,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 1')]
        ),
        m(
          FaceliftCard,
          {
            elevation: 2,
            interactive: true,
            fluid: false,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 2')]
        ),
        m(
          FaceliftCard,
          {
            elevation: 3,
            interactive: true,
            fluid: false,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 3')]
        ),
      ]),
      m(
        FaceliftCard,
        {
          elevation: 1,
          interactive: true,
          fluid: true,
        },
        [m('h4', 'Card title'), m('div', 'Fluid: true')]
      ),
      m(
        FaceliftCard,
        {
          elevation: 1,
          interactive: true,
          class_name: '.form-card',
        },
        [
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
