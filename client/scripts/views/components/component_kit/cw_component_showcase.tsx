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
import { CWIconButton } from './cw_icon_button';
import { CWRadioButton } from './cw_radio_button';
import { CWPopover } from './cw_popover/cw_popover';
import { CWCheckbox } from './cw_checkbox';
import { CWTooltip } from './cw_tooltip';
import { CWOverlay } from './cw_overlay';

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
  private checkboxChecked: boolean;
  private radioButtonChecked: boolean;
  private radioGroupSelection: string;
  private selectedIconButton: number;

  oninit() {
    this.radioGroupSelection = radioGroupOptions[2].value;
  }

  view() {
    return (
      <div class="ComponentShowcase">
        <h1>Popover</h1>
        <div style="display: flex; width: 80%; justify-content: space-between;">
          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Click Toggle'} />}
            content={
              <div>
                <div style="height: 100px; display: flex; justify-content: center; align-items: center;">
                  <CWButton
                    label="click me"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked!');
                    }}
                  />
                </div>
              </div>
            }
            toSide={false}
            showArrow={true}
            interactionType="click"
          />

          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Click Toggle (Large Content)'} />}
            content={
              <div>
                <div style="height: 400px; display: flex; justify-content: center; align-items: center;">
                  <CWButton
                    label="click me"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked!');
                    }}
                  />
                </div>
              </div>
            }
            toSide={false}
            showArrow={true}
            interactionType="click"
          />

          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Hover Toggle'} />}
            content={
              <div>
                <div style="height: 100px; display: flex; justify-content: center; align-items: center;">
                  I do not have a delay, so I can't be moused over
                </div>
              </div>
            }
            toSide={false}
            showArrow={true}
            interactionType="hover"
          />
          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Hover Toggle 2'} />}
            content={
              <div>
                <div style="height: 100px; display: flex; justify-content: center; align-items: center;">
                  <CWButton
                    label="click me"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked!');
                    }}
                  />
                </div>
              </div>
            }
            toSide={false}
            showArrow={true}
            interactionType="hover"
            hoverOpenDelay={200}
          />
          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Side Toggle'} />}
            content={
              <div>
                <div style="height: 100px; display: flex; justify-content: center; align-items: center;">
                  <CWButton
                    label="click me"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked!');
                    }}
                  />
                </div>
              </div>
            }
            toSide={true}
            showArrow={true}
            interactionType="hover"
            hoverOpenDelay={200}
          />
          <CWPopover
            onToggle={(isOpen: boolean) =>
              console.log("I've been toggled! I am open: ", isOpen)
            }
            trigger={<CWButton label={'Arrowless Toggle'} />}
            content={
              <div>
                <div style="height: 100px; display: flex; justify-content: center; align-items: center;">
                  <CWButton
                    label="click me"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked!');
                    }}
                  />
                </div>
              </div>
            }
            toSide={false}
            showArrow={false}
            interactionType="hover"
            hoverOpenDelay={200}
          />
        </div>
        <h1>Tooltip</h1>
        <div style="display: flex; width: 30%; justify-content: space-between;">
          <CWTooltip
            trigger={<CWButton label={'Tooltip Large'} />}
            content={
              <div>
                You can hover over me and I won't disappear- an effect whose
                necessary conditions include setting a nonzero hoverOpenDelay
                and a value of true for persistOnHover. I am also set with
                singleLine=false
              </div>
            }
            hoverOpenDelay={100}
            persistOnHover={true}
          />
          <CWTooltip
            trigger={<CWButton label={'Tooltip Small'} />}
            content={
              <div
                style="color: white; font-size: 12px;
              "
              >
                0x1234567891011121314151617181920
              </div>
            }
            hoverOpenDelay={100}
            singleLine={true}
          />
        </div>
        <h1>Layover</h1>
        <div style="display: flex; width: 30%; justify-content: space-between;">
          <CWOverlay
            isOpen={true}
            target={<CWButton label={'Tooltip Small'} />}
            content={<div>0x1234567891011121314151617181920</div>}
          />
        </div>
        <h1>Text</h1>
        <div class="text-gallery">
          <CWText fontWeight="semiBold" type="d1">
            Display1 semi bold
          </CWText>
          <CWText type="d1" fontWeight="bold">
            Display1 bold
          </CWText>
          <CWText type="d1" fontWeight="black">
            Display1 black
          </CWText>
          <CWText fontWeight="semiBold" type="d2">
            Display2 semi bold
          </CWText>
          <CWText type="d2" fontWeight="bold">
            Display2 bold
          </CWText>
          <CWText type="d2" fontWeight="black">
            Display2 black
          </CWText>
          <CWText fontWeight="medium" type="h1">
            Heading1 medium
          </CWText>
          <CWText type="h1" fontWeight="semiBold">
            Heading1 semi bold
          </CWText>
          <CWText type="h1" fontWeight="bold">
            Heading1 bold
          </CWText>
          <CWText fontWeight="medium" type="h2">
            Heading2 medium
          </CWText>
          <CWText type="h2" fontWeight="semiBold">
            Heading2 semi bold
          </CWText>
          <CWText type="h2" fontWeight="bold">
            Heading2 bold
          </CWText>
          <CWText fontWeight="medium" type="h3">
            Heading3 medium
          </CWText>
          <CWText type="h3" fontWeight="semiBold">
            Heading3 semi bold
          </CWText>
          <CWText type="h3" fontWeight="bold">
            Heading3 bold
          </CWText>
          <CWText fontWeight="medium" type="h4">
            Heading4 medium
          </CWText>
          <CWText type="h4" fontWeight="semiBold">
            Heading4 semi bold
          </CWText>
          <CWText type="h4" fontWeight="bold">
            Heading4 bold
          </CWText>
          <CWText fontWeight="medium" type="h5">
            Heading5 medium
          </CWText>
          <CWText type="h5" fontWeight="semiBold">
            Heading5 semi bold
          </CWText>
          <CWText type="h5" fontWeight="bold">
            Heading5 bold
          </CWText>
          <CWText type="b1">Body1 regular</CWText>
          <CWText type="b1" fontWeight="bold">
            Body1 bold
          </CWText>
          <CWText type="b1" fontWeight="italic">
            Body1 italic
          </CWText>
          <CWText type="b2">Body2 regular</CWText>
          <CWText type="b2" fontWeight="bold">
            Body2 bold
          </CWText>
          <CWText type="b2" fontWeight="italic">
            Body2 italic
          </CWText>
          <CWText type="caption">Caption regular</CWText>
          <CWText type="caption" fontWeight="medium">
            Caption medium
          </CWText>
          <CWText type="caption" fontWeight="uppercase">
            Caption uppercase
          </CWText>
          <CWText type="buttonSm">Button small</CWText>
          <CWText type="buttonLg">Button large</CWText>
          <div class="text-row">
            <CWText type="h3">Disabled</CWText>
            <CWText type="h3" disabled={true}>
              Body1 disabled
            </CWText>
          </div>
          <div class="text-row">
            <CWText type="h3">Overflow</CWText>
            <div class="ellipsis-row">
              <CWText type="h3">Body1 noWrap</CWText>
            </div>
          </div>
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
        <h1>Icon Buttons</h1>
        <div class="icon-button-gallery">
          <div class="icon-button-subheader">Click to see selected state</div>
          <div class="icon-button-row">
            <CWIconButton
              iconName="views"
              iconSize="large"
              iconButtonTheme="primary"
              selected={this.selectedIconButton === 1}
              onclick={() => {
                this.selectedIconButton = 1;
              }}
            />
            {this.selectedIconButton === 1 && (
              <div class="icon-button-selected">is selected</div>
            )}
          </div>
          <div class="icon-button-row">
            <CWIconButton
              iconName="views"
              iconSize="large"
              iconButtonTheme="neutral"
              selected={this.selectedIconButton === 2}
              onclick={() => {
                this.selectedIconButton = 2;
              }}
            />
            {this.selectedIconButton === 2 && (
              <div class="icon-button-selected">is selected</div>
            )}
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
        <h1>Radio Button</h1>
        <div class="choice-gallery">
          <CWRadioButton
            value="Radio Button"
            label="Radio Button"
            checked={this.radioButtonChecked === true}
            onchange={() => {
              this.radioButtonChecked = true;
            }}
          />
          <CWRadioButton
            value="Disabled Radio Button"
            label="Disabled Radio Button"
            disabled
          />
          <CWRadioButton
            value="Checked and Disabled Radio Button"
            label="Checked and Disabled Radio Button"
            disabled
            checked
          />
        </div>
        <h1>Radio Group</h1>
        <div class="button-gallery">
          <CWRadioGroup
            options={radioGroupOptions}
            name="RadioGroup"
            toggledOption={this.radioGroupSelection}
            onchange={(e) => {
              this.radioGroupSelection = e.target.value;
              notifySuccess(`"${e.target.value}" selected`);
            }}
          />
        </div>
        <h1>Checkbox</h1>
        <div class="choice-gallery">
          <CWCheckbox
            checked={this.checkboxChecked === true}
            label="Click me"
            onchange={() => {
              this.checkboxChecked = !this.checkboxChecked;
            }}
          />
          <CWCheckbox label="Disabled" disabled />
          <CWCheckbox label="Checked and disabled" disabled checked />
          <CWCheckbox label="Indeterminate" indeterminate />
          <CWCheckbox
            label="Indeterminate and disabled"
            disabled
            indeterminate
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
