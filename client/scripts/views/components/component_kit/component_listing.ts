import m from 'mithril';
import 'components/component_kit/component_listing.scss';

import { notifySuccess } from 'controllers/app/notifications';
import { CWButton } from './cw_button';
import { CWGradientButton } from './cw_gradient_button';
import { CWButtonGroup } from './cw_button_group';
import { CWExternalLink } from './cw_external_link';
import { CWRadioGroup } from './cw_radio_group';
import { CWEngagementButton } from './cw_engagement_button';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCard } from './cw_card';
import { CWTextInput, ValidationStatus } from './cw_text_input';

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

const ComponentListing: m.Component = {
  view: () => {
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
          CWCard,
          {
            elevation: 'elevation-1',
            interactive: true,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 1')]
        ),
        m(
          CWCard,
          {
            elevation: 'elevation-2',
            interactive: true,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 2')]
        ),
        m(
          CWCard,
          {
            elevation: 'elevation-3',
            interactive: true,
            onclick: () => notifySuccess('Card clicked!'),
          },
          [m('h4', 'Card title'), m('div', 'Elevation: 3')]
        ),
      ]),
      m(
        CWCard,
        {
          elevation: 'elevation-1',
          interactive: true,
          fullWidth: true,
        },
        [m('h4', 'Card title'), m('div', 'Full width')]
      ),
      m('h1', 'Form Fields'),
      m(
        '.form-gallery',
        {
          style: 'max-width: 600px;',
        },
        [
          m(CWTextInput, {
            name: 'Form field',
            inputValidationFn: (val: string): [ValidationStatus, string] => {
              if (val.match(/[^A-Za-z]/)) {
                return [ValidationStatus.Failure, 'Must enter characters A-Z'];
              } else {
                return [ValidationStatus.Success, 'Input validated'];
              }
            },
            label: 'This input only accepts A-Z',
            placeholder: 'Placeholder',
          }),
          m(CWTextInput, {
            name: 'Text field',
            label: 'No status message or error validation',
            placeholder: 'Placeholder',
          }),
        ]
      ),
    ]);
  },
};

export default ComponentListing;
