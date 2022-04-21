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
import { CWBodyText, CWDisplayText, CWHeadingText } from './cw_text';

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
          <CWDisplayText>Display 01</CWDisplayText>
          <CWDisplayText fontStyle="bold">Display 01</CWDisplayText>
          <CWDisplayText fontStyle="black">Display 01</CWDisplayText>
          <CWDisplayText>Display 02</CWDisplayText>
          <CWDisplayText type="display-02" fontStyle="bold">
            Display 02
          </CWDisplayText>
          <CWDisplayText type="display-02" fontStyle="black">
            Display 02
          </CWDisplayText>
          <CWHeadingText>Heading 01</CWHeadingText>
          <CWHeadingText fontStyle="semi-bold">
            Heading 01 semi bold
          </CWHeadingText>
          <CWHeadingText fontStyle="bold">Heading 01 bold</CWHeadingText>
          <CWHeadingText type="heading-02">Heading 02</CWHeadingText>
          <CWHeadingText type="heading-02" fontStyle="semi-bold">
            Heading 02 semi bold
          </CWHeadingText>
          <CWHeadingText type="heading-02" fontStyle="bold">
            Heading 02 bold
          </CWHeadingText>
          <CWHeadingText type="heading-03">Heading 03</CWHeadingText>
          <CWHeadingText type="heading-03" fontStyle="semi-bold">
            Heading 03 semi bold
          </CWHeadingText>
          <CWHeadingText type="heading-03" fontStyle="bold">
            Heading 03 bold
          </CWHeadingText>
          <CWHeadingText type="heading-04">Heading 04</CWHeadingText>
          <CWHeadingText type="heading-04" fontStyle="semi-bold">
            Heading 04 semi bold
          </CWHeadingText>
          <CWHeadingText type="heading-04" fontStyle="bold">
            Heading 04 bold
          </CWHeadingText>
          <CWHeadingText type="heading-05">Heading 05</CWHeadingText>
          <CWHeadingText type="heading-05" fontStyle="semi-bold">
            Heading 05 semi bold
          </CWHeadingText>
          <CWHeadingText type="heading-05" fontStyle="bold">
            Heading 05 bold
          </CWHeadingText>
          <CWBodyText>Body 01</CWBodyText>
          <CWBodyText fontStyle="bold">Body 01 bold</CWBodyText>
          <CWBodyText fontStyle="italic">Body 01 italic</CWBodyText>
          <CWBodyText type="body-02">Body 02</CWBodyText>
          <CWBodyText type="body-02" fontStyle="bold">
            Body 02 bold
          </CWBodyText>
          <CWBodyText type="body-02" fontStyle="italic">
            Body 02 italic
          </CWBodyText>
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
