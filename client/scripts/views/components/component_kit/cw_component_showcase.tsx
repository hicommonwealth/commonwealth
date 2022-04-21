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
import { iconLookup } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';

// const displayColors = (hexList) => {
//   return Object.entries(hexList).map(([k, v]) => {
//     return (
//       <div class="color-row">
//         {k}
//         <div class="color" style={`background: ${v};`} />
//       </div>
//     );
//   });
// };

// const displayGradients = (gradientNames: string[]) => {
//   return gradientNames.map((gradient) => {
//     return (
//       <div class="color-row">
//         {gradient}
//         <div class={`color ${gradient}`} />
//       </div>
//     );
//   });
// };

const displayIcons = (icons) => {
  return Object.entries(icons).map(([k, v]) => {
    return (
      <div class="icon-container">
        <div class="icon-name">{k}</div>
        <CWIcon iconName={k} />
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
        <h1>Text</h1>
        <div class="text-gallery">
          <CWText type="d1">Display1</CWText>
          <CWText type="d1" fontStyle="bold">
            Display1
          </CWText>
          <CWText type="d1" fontStyle="black">
            Display1
          </CWText>
          <CWText type="d2">Display2</CWText>
          <CWText type="d2" fontStyle="bold">
            Display2
          </CWText>
          <CWText type="d2" fontStyle="black">
            Display2
          </CWText>
          <CWText type="h1">Heading1</CWText>
          <CWText type="h1" fontStyle="semi-bold">
            Heading1 semi bold
          </CWText>
          <CWText type="h1" fontStyle="bold">
            Heading1 bold
          </CWText>
          <CWText type="h2">Heading2</CWText>
          <CWText type="h2" fontStyle="semi-bold">
            Heading2 semi bold
          </CWText>
          <CWText type="h2" fontStyle="bold">
            Heading2 bold
          </CWText>
          <CWText type="h3">Heading3</CWText>
          <CWText type="h3" fontStyle="semi-bold">
            Heading3 semi bold
          </CWText>
          <CWText type="h3" fontStyle="bold">
            Heading3 bold
          </CWText>
          <CWText type="h4">Heading4</CWText>
          <CWText type="h4" fontStyle="semi-bold">
            Heading4 semi bold
          </CWText>
          <CWText type="h4" fontStyle="bold">
            Heading4 bold
          </CWText>
          <CWText type="h5">Heading5</CWText>
          <CWText type="h5" fontStyle="semi-bold">
            Heading5 semi bold
          </CWText>
          <CWText type="h5" fontStyle="bold">
            Heading5 bold
          </CWText>
          <CWText type="b1">Body 01</CWText>
          <CWText type="b1" fontStyle="bold">
            Body1 bold
          </CWText>
          <CWText type="b1" fontStyle="italic">
            Body1 italic
          </CWText>
          <CWText type="b2">Body2</CWText>
          <CWText type="b2" fontStyle="bold">
            Body2 bold
          </CWText>
          <CWText type="b2" fontStyle="italic">
            Body2 italic
          </CWText>
        </div>
        <h1>Icons</h1>
        <div class="icon-gallery">
          <div class="all-icons-container">{displayIcons(iconLookup)}</div>
          <div class="icon-row">
            Small
            <CWIcon iconName="views" iconSize="small" />
          </div>
          <div class="icon-row">
            Medium
            <CWIcon iconName="views" />
          </div>
          <div class="icon-row">
            Large
            <CWIcon iconName="views" iconSize="large" />
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
