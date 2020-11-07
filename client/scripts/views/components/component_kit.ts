import m from 'mithril';

import {
  Breadcrumb, BreadcrumbItem,
  Icon, Icons,
  Input, TextArea,
  Button, ButtonGroup,
  Card, Callout,
  Form, FormGroup, FormLabel,
  List, ListItem,
  Menu, MenuItem,
  PopoverMenu,
  Switch, Checkbox,
  Radio, RadioGroup,
  Spinner,
  Tag,
  Tabs, TabItem,
  Table
} from 'construct-ui';

const ComponentKit: m.Component<{}, { radioGroupSelected, activeTab }> = {
  view: (vnode) => {
    return m('.ComponentKit', [
      m('style', '.ComponentKit > * { margin: 20px; }\n .ComponentKit > .gallery > * { margin-right: 20px; }'),

      // buttons and inputs
      m('.gallery', [
        m(Button, {
          label: 'Default',
          intent: 'none',
        }),
        m(Button, {
          label: 'Primary',
          intent: 'primary',
        }),
        m(Button, {
          label: 'Positive',
          intent: 'positive',
        }),
        m(Button, {
          label: 'Negative',
          intent: 'negative',
        }),
      ]),
      m('.gallery', [
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
        }),
        m(Button, {
          label: 'Cancel',
          intent: 'none',
        }),
      ]),
      m('.gallery', [
        m(Button, {
          label: 'Basic',
          basic: true,
        }),
        m(Button, {
          label: 'Outlined',
          outlined: true,
        }),
        m(Button, {
          label: 'Compact',
          compact: true,
        }),
        m(Button, {
          label: 'Disabled',
          disabled: true,
        }),
        m(Button, {
          label: 'Label',
          sublabel: 'Sublabel',
        }),
        m(Button, {
          label: 'Loading',
          loading: true,
        }),
      ]),
      m('.gallery', [
        m(ButtonGroup, [
          m(Button, {
            iconLeft: Icons.COPY,
            label: 'Copy'
          }),
          m(Button, {
            iconLeft: Icons.SETTINGS,
            label: 'Settings'
          }),
          m(Button, {
            iconLeft: Icons.LINK,
            iconRight: Icons.CHEVRON_DOWN,
            label: 'Link'
          })
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
          intent: 'primary'
        }),
        m(Switch, {
          label: 'Switch (small)',
          size: 'sm',
        }),
      ]),

      // breadcrumb
      m(Breadcrumb, {
        size: 'default',
        seperator: m(Icon, { name: Icons.CHEVRON_RIGHT })
      }, [
        m(BreadcrumbItem, { href: '#' }, m(Icon, { name: Icons.HOME })),
        m(BreadcrumbItem, { href: '#' }, 'Application'),
        m(BreadcrumbItem, 'Section 1')
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
        m(Tag, { rounded: true, size: 'xs', label: [ m(Icon, { name: Icons.LOCK }), ' Extra small' ] }),
        m(Tag, { rounded: true, size: 'sm', label: [ m(Icon, { name: Icons.LOCK }), ' Small' ] }),
        m(Tag, { rounded: true, size: 'default', label: [ m(Icon, { name: Icons.LOCK }), ' Default' ] }),
        m(Tag, { rounded: true, size: 'lg', label: [ m(Icon, { name: Icons.LOCK }), ' Large' ] }),
        m(Tag, { rounded: true, size: 'xl', label: [ m(Icon, { name: Icons.LOCK }), ' Extra large' ] }),
      ]),

      // callout
      m('div', [
        m(Callout, {
          header: 'Callout header',
          content: 'Commodo maecenas elit vivamus volutpat urna ridiculus mauris aptent tellus etiam varius sodales',
          icon: Icons.ALERT_CIRCLE,
          size: 'default',
          intent: 'primary',
        }),
      ]),
      m('div', [
        m(Callout, {
          header: 'Callout header',
          content: 'Commodo maecenas elit vivamus volutpat urna ridiculus mauris aptent tellus etiam varius sodales',
          size: 'sm',
          intent: 'none',
        }),
      ]),

      // card
      m('div', [
        m(Card, {
          elevation: 0,
          fluid: true,
          interactive: true,
          size: 'default',
          style: 'min-width: 300px'
        }, [
          m('h4', 'Card title'),
          m('div', 'Card content'),
        ]),
      ]),
      m('div', [
        m(Card, {
          elevation: 0,
          size: 'default',
          style: 'min-width: 300px'
        }, [
          m('h4', 'Card title'),
          m('div', 'Card content'),
        ]),
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
              placeholder: 'Username...'
            })
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'password' }, 'Password'),
            m(Input, {
              contentLeft: m(Icon, { name: Icons.LOCK }),
              id: 'password',
              name: 'password',
              placeholder: 'Password...'
            })
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
                placeholder: 'Name...'
              })
            ]),
            m(FormGroup, [
              m(FormLabel, { for: 'bio' }, 'Bio'),
              m(TextArea, {
                id: 'bio',
                name: 'bio',
                placeholder: 'Bio...'
              })
            ]),
            m(FormGroup, [
              m(FormLabel, { for: 'privacy' }, 'Privacy'),
              m(RadioGroup, {
                options: ['Public', 'Private'],
                name: 'privacy',
                onchange: (e) => { vnode.state.radioGroupSelected = (e.currentTarget as HTMLInputElement).value; },
                value: vnode.state.radioGroupSelected,
              }),
            ]),
          ]),
        ]),
      ]),

      // list
      m('div', [
        m(List, [ 'List item 1', 'List item 2', 'List item 3', 'List item 4' ].map((item) => m(ListItem, {
          contentLeft: m(Icon, { name: Icons.LINK }),
          contentRight: m(PopoverMenu, {
            closeOnContentClick: true,
            content: [
              m(MenuItem, {
                iconLeft: Icons.EDIT,
                label: 'Edit'
              }),
              m(MenuItem, {
                iconLeft: Icons.TRASH_2,
                label: 'Delete',
                intent: 'negative'
              })
            ],
            trigger: m(Button, {
              iconLeft: Icons.MORE_HORIZONTAL,
              size: 'xs'
            }),
            position: 'bottom-end'
          }),
          label: item
        }))),
      ]),

      // tabs
      m(Tabs, {
        align: 'left',
        bordered: true,
        fluid: false,
        size: 'default',
      }, [
        [ 'Accounts', 'Projects', 'Settings' ].map((item) => m(TabItem, {
          label: [
            item === 'Settings' && m(Icon, {
              name: Icons.SETTINGS,
              style: 'margin-right: 5px'
            }),
            item
          ],
          active: vnode.state.activeTab === item || (!vnode.state.activeTab && item === 'Accounts'),
          onclick: () => { vnode.state.activeTab = item; },
        }))
      ]),
      m(Tabs, {
        align: 'center',
        bordered: true,
        fluid: false,
        size: 'default',
      }, [
        [ 'Accounts', 'Projects', 'Settings' ].map((item) => m(TabItem, {
          label: [
            item === 'Settings' && m(Icon, {
              name: Icons.SETTINGS,
              style: 'margin-right: 5px'
            }),
            item
          ],
          active: vnode.state.activeTab === item || (!vnode.state.activeTab && item === 'Accounts'),
          onclick: () => { vnode.state.activeTab = item; },
        }))
      ]),

      // table
      m('div', [
        m(Table, {
          bordered: false,
          interactive: true,
          striped: false,
        }, [
          m('tr', [
            m('th', 'Heading 1'),
            m('th', 'Heading 2')
          ]),
          m('tr', [
            m('td', 'Cell 1'),
            m('td', 'Cell 2')
          ]),
          m('tr', [
            m('td', 'Cell 1'),
            m('td', 'Cell 2')
          ]),
          m('tr', [
            m('td', 'Cell 1'),
            m('td', 'Cell 2')
          ])
        ])
      ]),

      // spinner
      m(Card, [
        m(Spinner, { active: true, fill: true }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'xs', message: 'Extra small' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'sm', message: 'Small' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'default', message: 'Default' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'lg', message: 'Large' }),
      ]),
      m(Card, { style: 'height: 160px' }, [
        m(Spinner, { active: true, fill: true, size: 'xl', message: 'Extra large' }),
      ]),
    ]);
  }
};

export default ComponentKit;
