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
import { CWTextInput, ValidationStatus } from './cw_text_input';
import { CWTooltip } from './cw_tooltip';

const displayColors = (hexList) => {
  return Object.entries(hexList).map(([k, v]) => {
    return (
      <div class="color-row">
        {k}
        <div class="color" style={`background: ${v};`} />
      </div>
    );
  });
};

const displayGradients = (gradientNames: string[]) => {
  return gradientNames.map((gradient) => {
    return (
      <div class="color-row">
        {gradient}
        <div class={`color ${gradient}`} />
      </div>
    );
  });
};

const radioGroupOptions = [
  { label: 'This', value: 'This' },
  { label: 'Is', value: 'Is' },
  { label: 'A', value: 'A' },
  { label: 'Radio', value: 'Radio' },
  { label: 'Group', value: 'Group' },
];

export class ComponentShowcase implements m.ClassComponent {
  view() {
    return (
      <div class="ComponentShowcase">
        <h1>Popover</h1>
        <div class="popover-gallery">
          <CWTooltip
            triggerLabel="Click me"
            tooltipContent="This is the popover's contents"
          />
        </div>
        <h1>Colors</h1>
        <div class="color-gallery">
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
            CaribGreen: '#00C0A9',
            FoamGreen: '#B4F1EA',
            MintGreen: '#F3FFF9',
            CreamYellow: '#FFFBA1',
          })}
        </div>
        <h1>Gradients</h1>
        <div class="color-gallery">
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
            <CWIcon iconName="views" iconSize="small" />
          </div>
          <div class="icon-row">
            Primary Medium
            <CWIcon iconName="views" />
          </div>
          <div class="icon-row">
            Primary Large
            <CWIcon iconName="views" iconSize="large" />
          </div>
          <div class="icon-row">
            Secondary Large
            <CWIcon iconName="views" iconSize="large" iconType="secondary" />
          </div>
          <div class="icon-row">
            Disabled Large
            <CWIcon iconName="views" iconSize="large" disabled={true} />
          </div>
        </div>
        <h1>Buttons</h1>
        <div class="button-gallery">
          <CWButton
            label="Primary"
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Disabled"
            disabled={true}
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary"
            buttonType="secondary"
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary"
            buttonType="secondary"
            disabled={true}
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWGradientButton
            label="Primary"
            onclick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <h1>Button Group</h1>
        <div class="button-gallery">
          <CWButtonGroup>
            <CWButton
              label="One"
              onclick={() => notifySuccess('One clicked!')}
            />
            <CWButton
              label="Two"
              onclick={() => notifySuccess('Two clicked!')}
            />
            <CWButton
              label="Three"
              onclick={() => notifySuccess('Three clicked!')}
            />
            <CWButton
              label="Four"
              onclick={() => notifySuccess('Four clicked!')}
            />
          </CWButtonGroup>
        </div>
        <h1>External Link Buttons</h1>
        <div class="button-gallery">
          <CWExternalLink
            label="Button external link"
            target="https://edgewa.re/"
            linkType="button"
          />
          <CWExternalLink
            label="Inline external link"
            target="https://edgewa.re/"
            linkType="inline"
          />
        </div>
        <h1>Radio Group</h1>
        <div class="button-gallery">
          <CWRadioGroup
            options={radioGroupOptions}
            defaultValue={radioGroupOptions[2]}
            name="RadioGroup"
            onchange={(e) => notifySuccess(`"${e.target.value}" selected`)}
          />
        </div>
        <h1>Engagement Buttons</h1>
        <div class="button-gallery">
          <CWEngagementButton
            buttonSize="sm"
            label="Small"
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWEngagementButton
            buttonSize="lg"
            label="Big"
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWEngagementButton
            buttonSize="sm"
            label="Small"
            disabled={true}
            onclick={() => notifySuccess('Button clicked!')}
          />
          <CWEngagementButton
            buttonSize="lg"
            label="Big"
            disabled={true}
            onclick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <h1>Cards</h1>
        <div class="card-gallery">
          <div class="top-card-row">
            <CWCard
              elevation="elevation-1"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <h4>Card title</h4>
              <div>Elevation: 1</div>
            </CWCard>
            <CWCard
              elevation="elevation-2"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <h4>Card title</h4>
              <div>Elevation: 2</div>
            </CWCard>
            <CWCard
              elevation="elevation-3"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <h4>Card title</h4>
              <div>Elevation: 3</div>
            </CWCard>
          </div>
          <CWCard
            elevation="elevation-1"
            interactive={true}
            fullWidth={true}
            onclick={() => notifySuccess('Card clicked!')}
          >
            <h4>Card title</h4>
            <div>Full width</div>
          </CWCard>
        </div>
        <h1>Form fields</h1>
        <div class="form-gallery">
          <CWTextInput
            name="Form field"
            inputValidationFn={(val: string): [ValidationStatus, string] => {
              if (val.match(/[^A-Za-z]/)) {
                return [ValidationStatus.Failure, 'Must enter characters A-Z'];
              } else {
                return [ValidationStatus.Success, 'Input validated'];
              }
            }}
            label="This input only accepts A-Z"
            placeholder="Placeholder"
          />
          <CWTextInput
            name="Text field"
            label="No status message or error validation"
            placeholder="Placeholder"
          />
        </div>
      </div>
    );
  }
}
