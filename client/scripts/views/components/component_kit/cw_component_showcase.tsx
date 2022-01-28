/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_component_showcase.scss';

import { notifySuccess } from 'controllers/app/notifications';
import { CWButton } from './cw_button';
import { CWGradientButton } from './cw_gradient_button';
import { CWButtonGroup } from './cw_button_group';
import { CWExternalLink } from './cw_external_link';
import { CWRadioGroup } from './cw_radio_group';
import { CWEngagementButton } from './cw_engagement_button';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCard } from './cw_card';

const displayColors = (hexList) => {
  return Object.entries(hexList).map(([k, v]) => {
    return (
      <div class="hex-row">
        <div class="hex-name">{k}</div>
        <div class="hex-sample" style={`background: ${v};`} />
      </div>
    );
  });
};

const displayGradients = (gradientNames: string[]) => {
  return gradientNames.map((gradient) => {
    return (
      <div class="gradient-row">
        <div class="gradient-name">{gradient}</div>
        <div class={`gradient-sample ${gradient}`} />
      </div>
    );
  });
};

export const ComponentShowcase: m.Component = {
  view: () => {
    return (
      <div class="ComponentShowcase">
        <h1>Colors</h1>
        <div class="hex-listing">
          {displayColors({
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
          })}
        </div>
        <h1>Gradients</h1>
        <div class="gradient-listing">
          {displayGradients([
            'rainbow-gradient-horizontal',
            'rainbow-gradient-diagonal',
            'shadow-gradient',
          ])}
        </div>
        <h1>Icons</h1>
        <div class="icon-gallery">
          <div class="icon-row">
            Primary Small
            {m(CWIcon, {
              iconName: 'views',
              iconSize: 'small',
            })}
          </div>
          <div class="icon-row">
            Primary Medium
            {m(CWIcon, {
              iconName: 'views',
            })}
          </div>
          <div class="icon-row">
            Primary Large
            {m(CWIcon, {
              iconName: 'views',
              iconSize: 'large',
            })}
          </div>
          <div class="icon-row">
            Disabled Large
            {m(CWIcon, {
              iconName: 'views',
              iconSize: 'large',
              disabled: true,
            })}
          </div>
        </div>
        <h1>Buttons</h1>
        <div class="button-gallery">
          {m(CWButton, {
            label: 'Primary',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWButton, {
            disabled: true,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWButton, {
            buttonType: 'secondary',
            label: 'Secondary',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWButton, {
            buttonType: 'secondary',
            disabled: true,
            label: 'Disabled',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWGradientButton, {
            label: 'Primary',
            onclick: () => notifySuccess('Button clicked!'),
          })}
        </div>
        <h1>Button Group</h1>
        <div class="button-gallery">
          {m(CWButtonGroup, {
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
          })}
        </div>
        <h1>External Link Buttons</h1>
        <div class="button-gallery">
          {m(CWExternalLink, {
            label: 'Button external link',
            target: 'https://edgewa.re/',
            linkType: 'button',
          })}
          {m(CWExternalLink, {
            label: 'Inline external link',
            target: 'https://edgewa.re/',
            linkType: 'inline',
          })}
        </div>
        <h1>Radio Group</h1>
        <div class="button-gallery">
          <CWRadioGroup
            values={['This', 'Is', 'A', 'Radio', 'Group']}
            labels={['This', 'Is', 'A', 'Radio', 'Group']}
            defaultValue = 'A'
            name= 'RadioGroup'
            onchange={(e) => notifySuccess(`"${e.target.value}" selected`)}
          />
        </div>
        <h1>Engagement Buttons</h1>
        <div class="button-gallery">
          {m(CWEngagementButton, {
            buttonSize: 'sm',
            label: 'Small',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWEngagementButton, {
            buttonSize: 'lg',
            label: 'Big',
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWEngagementButton, {
            buttonSize: 'sm',
            label: 'Small',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          })}
          {m(CWEngagementButton, {
            buttonSize: 'lg',
            label: 'Big',
            disabled: true,
            onclick: () => notifySuccess('Button clicked!'),
          })}
        </div>
        <h1>Cards</h1>
        <div class="card-gallery">
          <CWCard
            elevation="elevation-1"
            interactive={true}
            onclick={() => notifySuccess('Card clicked!')}
          >
            <h4>Card title</h4>
            <div>Elevation: 1</div>
          </CWCard>
          {/* {m(
            CWCard,
            {
              elevation: 'elevation-1',
              interactive: true,
              onclick: () => notifySuccess('Card clicked!'),
            },
            [m('h4', 'Card title'), m('div', 'Elevation: 1')]
          )} */}
        </div>
      </div>
    );
  },
};
