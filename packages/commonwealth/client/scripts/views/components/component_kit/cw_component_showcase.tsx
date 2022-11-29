/* @jsx m */
import m from 'mithril';

import 'components/component_kit/cw_component_showcase.scss';

import { notifySuccess } from 'controllers/app/notifications';
import { CWButton } from './cw_button';
import { CWRadioGroup } from './cw_radio_group';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCard } from './cw_card';
import { CWTextInput } from './cw_text_input';
import { iconLookup } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { CWIconButton } from './cw_icon_button';
import { CWRadioButton } from './cw_radio_button';
import { CWWalletOptionRow } from './cw_wallet_option_row';
import { CWAccountCreationButton } from './cw_account_creation_button';
import { CWCheckbox } from './cw_checkbox';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { CWAddressTooltip } from './cw_popover/cw_address_tooltip';
import { ValidationStatus } from './cw_validation_text';
import { CWTextArea } from './cw_text_area';
import { CWTab, CWTabBar } from './cw_tabs';
import { CWProgressBar } from './cw_progress_bar';
import { CWThreadVoteButton } from './cw_thread_vote_button';
import { CWToggle } from './cw_toggle';
import { CWPopoverMenu } from './cw_popover/cw_popover_menu';
import { CWCollapsible } from './cw_collapsible';
import { CWBreadcrumbs } from './cw_breadcrumbs';
import { CWTag } from './cw_tag';
import { CWSpinner } from './cw_spinner';
import { CWDropdown } from './cw_dropdown';
import CWCoverImageUploader from './cw_cover_image_uploader';

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
  private selectedTab: number;
  private toggleToggled: boolean;
  private voteCount: number;

  oninit() {
    this.radioGroupSelection = radioGroupOptions[2].value;
    this.selectedTab = 1;
    this.voteCount = 0;
  }

  view() {
    return (
      <div class="ComponentShowcase">
        <div class="basic-gallery">
          <CWText type="h3">Content Page Card</CWText>
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Dropdown</CWText>
          <CWDropdown
            inputOptions={[
              { label: 'Dropdown Option 1' },
              { label: 'Dropdown Option 2' },
              { label: 'Dropdown Option 3' },
            ]}
            onSelect={(optionLabel) =>
              console.log('Selected option: ', optionLabel)
            }
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Spinner</CWText>
          <CWSpinner />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Breadcrumbs</CWText>
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Page', path: '' },
              { label: 'Page', path: '' },
              { label: 'Page', path: '' },
              { label: 'Current', path: '' },
            ]}
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Tag</CWText>
          <CWTag label="Ref #90" />
          <CWTag label="Passed" status="passed" />
          <CWTag label="Failed" status="failed" />
          <CWTag label="Active" status="active" />
          <CWTag label="12 days" iconName="clock" />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Popover Menu</CWText>
          <CWPopoverMenu
            trigger={<CWIconButton iconName="dotsVertical" />}
            menuItems={[
              { type: 'header', label: 'Community' },
              { label: 'Create Thread', iconLeft: 'write' },
              { label: 'Create Proposal', iconLeft: 'write' },
              { label: 'Create Poll', iconLeft: 'write' },
              { label: 'Create Snapshot', iconLeft: 'write', disabled: true },
              { type: 'divider' },
              { type: 'header', label: 'Universal' },
              { label: 'Create Community', iconLeft: 'people' },
              { label: 'Create Crowdfund', iconLeft: 'wallet' },
              { type: 'divider' },
              {
                label: 'Report',
                iconLeft: 'cautionCircle',
                isSecondary: true,
                onclick: () => console.log('clicked'),
              },
            ]}
          />
        </div>
        <div class="tooltip-gallery">
          <CWText type="h3">Tooltip</CWText>
          <div class="tooltip-row">
            <CWText>Hover</CWText>
            <CWTooltip
              interactionType="hover"
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="bordered"
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Hover to side</CWText>
            <CWTooltip
              interactionType="hover"
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="bordered"
              toSide
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Persist on hover</CWText>
            <CWTooltip
              trigger={<CWIcon iconName="infoEmpty" />}
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="bordered"
              interactionType="hover"
              persistOnHover
              hoverCloseDelay={1500}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Hover open and close delay</CWText>
            <CWTooltip
              trigger={<CWIcon iconName="infoEmpty" />}
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="bordered"
              interactionType="hover"
              hoverOpenDelay={1500}
              hoverCloseDelay={1500}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Click</CWText>
            <CWTooltip
              interactionType="click"
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="bordered"
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Solid background</CWText>
            <CWTooltip
              interactionType="hover"
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="solidArrow"
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Solid background, no arrow</CWText>
            <CWTooltip
              interactionType="hover"
              tooltipContent={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
              tooltipType="solidNoArrow"
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
          <div class="tooltip-row">
            <CWText>Address tooltip</CWText>
            <CWAddressTooltip
              address="0xa5430730f12f1128bf10dfba38c8e00bc4d90eea"
              trigger={<CWIcon iconName="infoEmpty" />}
            />
          </div>
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Collapsible</CWText>
          <CWCollapsible
            headerContent={<CWText>Header content</CWText>}
            collapsibleContent={<CWText>Body content</CWText>}
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Toggle</CWText>
          <CWToggle
            checked={this.toggleToggled}
            onchange={() => {
              this.toggleToggled = !this.toggleToggled;
            }}
          />
          <CWToggle
            disabled
            onchange={() => {
              this.toggleToggled = !this.toggleToggled;
            }}
          />
          <CWToggle
            checked
            disabled
            onchange={() => {
              this.toggleToggled = !this.toggleToggled;
            }}
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Vote Button</CWText>
          <CWThreadVoteButton
            updateVoteCount={(newCount: number) => {
              // TODO Gabe 7/27/22 - Add real db update
              this.voteCount = newCount;
            }}
            voteCount={this.voteCount}
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Tabs</CWText>
          <CWTabBar>
            <CWTab
              label="A tab"
              onclick={() => {
                this.selectedTab = 1;
              }}
              isSelected={this.selectedTab === 1}
            />
            <CWTab
              label="Another tab"
              onclick={() => {
                this.selectedTab = 2;
              }}
              isSelected={this.selectedTab === 2}
            />
            <CWTab
              label="Yet another tab"
              onclick={() => {
                this.selectedTab = 3;
              }}
              isSelected={this.selectedTab === 3}
            />
          </CWTabBar>
        </div>
        <div class="progress-gallery">
          <CWText type="h3">Progress Bars</CWText>
          <CWProgressBar
            progress={75}
            label="Progress Bar (Success)"
            progressStatus="passed"
            count={50}
          />
          <CWProgressBar
            progress={75}
            label="Progress Bar (Success) with Check"
            progressStatus="passed"
            count={50}
            iconName="check"
          />
          <CWProgressBar
            progress={100}
            label="Progress Bar (Selected)"
            progressStatus="selected"
            count={50}
          />
          <CWProgressBar
            progress={150}
            label="Progress Bar (Neutral) With Token"
            progressStatus="neutral"
            count={50}
            subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
          />
          <CWProgressBar
            progress={75}
            label="Progress Bar (Ongoing) With Token"
            progressStatus="ongoing"
            count={50}
            subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
          />
        </div>
        <div class="card-gallery">
          <CWText type="h3">Account Creation Button</CWText>
          <CWAccountCreationButton
            onclick={() => notifySuccess('Account creation button clicked!')}
          />
        </div>
        <div class="basic-gallery">
          <CWText type="h3">Wallet Row Card</CWText>
          <CWWalletOptionRow
            walletName="metamask"
            onclick={() => notifySuccess('MetaMask clicked!')}
          />
          <CWWalletOptionRow
            darkMode
            walletName="metamask"
            onclick={() => notifySuccess('MetaMask clicked!')}
          />
        </div>
        <div class="form-gallery">
          <CWText type="h3">Form fields</CWText>
          <CWTextInput
            name="Text field"
            label="Large"
            placeholder="Type here"
          />
          <CWTextInput
            name="Text field"
            label="Small"
            placeholder="Type here"
            size="small"
          />
          <CWTextInput
            name="Form field"
            inputValidationFn={(val: string): [ValidationStatus, string] => {
              if (val.match(/[^A-Za-z]/)) {
                return ['failure', 'Must enter characters A-Z'];
              } else {
                return ['success', 'Input validated'];
              }
            }}
            label="This input only accepts A-Z"
            placeholder="Type here"
          />
          <CWTextInput
            label="Text field with icon"
            name="Text field with icon"
            placeholder="Type here"
            iconRight="write"
          />
          <CWTextInput
            name="Text field"
            label="Disabled"
            disabled
            value="Some disabled text"
          />
          <CWTextInput
            name="Text field dark mode"
            label="Dark mode"
            darkMode
            placeholder="Type here"
          />
          <CWTextArea
            name="Textarea"
            label="Text area"
            placeholder="Type here"
          />
          <CWCoverImageUploader
            uploadCompleteCallback={(url: string) => {
              notifySuccess(`Image uploaded to ${url.slice(0, 18)}...`);
            }}
          />
        </div>
        <div class="button-gallery">
          <CWText type="h3">Buttons</CWText>
          <div class="button-row">
            <CWButton
              iconName="person"
              buttonType="primary-red"
              label="Primary red with icon"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              buttonType="primary-blue"
              label="Primary blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              buttonType="primary-black"
              label="Primary black"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Primary disabled"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              label="Secondary red with icon"
              buttonType="secondary-red"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Secondary blue"
              buttonType="secondary-blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Secondary black"
              buttonType="secondary-black"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Secondary disabled"
              buttonType="secondary-blue"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              label="Tertiary blue with icon"
              buttonType="tertiary-blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Tertiary black"
              buttonType="tertiary-black"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Tertiary disabled"
              buttonType="tertiary-black"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              label="Large primary red with icon"
              buttonType="lg-primary-red"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large primary blue"
              buttonType="lg-primary-blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large primary blue"
              buttonType="lg-primary-blue"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              label="Large secondary red with icon"
              buttonType="lg-secondary-red"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large secondary blue"
              buttonType="lg-secondary-blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large secondary disabled"
              buttonType="lg-secondary-blue"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              label="Large tertiary red with icon"
              buttonType="lg-tertiary-red"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large tertiary blue"
              buttonType="lg-tertiary-blue"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Large tertiary disabled"
              buttonType="lg-tertiary-blue"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              label="Primary blue dark disabled"
              buttonType="primary-blue-dark"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Secondary blue dark disabled"
              buttonType="secondary-blue-dark"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
          <div class="button-row">
            <CWButton
              iconName="person"
              buttonType="mini"
              label="Mini with icon"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Mini"
              buttonType="mini"
              onclick={() => notifySuccess('Button clicked!')}
            />
            <CWButton
              label="Mini Disabled"
              buttonType="mini"
              disabled
              onclick={() => notifySuccess('Button clicked!')}
            />
          </div>
        </div>
        <div class="text-gallery">
          <CWText type="h3">Text</CWText>
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
          <CWText type="buttonMini">Button mini</CWText>
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
              <CWText type="h3" noWrap>
                Body1 noWrap
              </CWText>
            </div>
          </div>
        </div>
        <div class="icon-gallery">
          <CWText type="h3">Icons</CWText>
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
        <div class="icon-button-gallery">
          <CWText type="h3">Icon Buttons</CWText>
          <CWText>Click to see selected state</CWText>
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
          <div class="icon-button-row">
            <CWIconButton
              iconName="views"
              iconSize="large"
              iconButtonTheme="black"
              selected={this.selectedIconButton === 3}
              onclick={() => {
                this.selectedIconButton = 3;
              }}
            />
            {this.selectedIconButton === 3 && (
              <div class="icon-button-selected">is selected</div>
            )}
          </div>
        </div>
        <div class="choice-gallery">
          <CWText type="h3">Radio Button</CWText>
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
        <div class="button-gallery">
          <CWText type="h3">Radio Group</CWText>
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
        <div class="choice-gallery">
          <CWText type="h3">Checkbox</CWText>
          <CWCheckbox
            checked={this.checkboxChecked}
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
        <div class="card-gallery">
          <CWText type="h3">Cards</CWText>
          <div class="top-card-row">
            <CWCard
              elevation="elevation-1"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <CWText fontWeight="semiBold">Card title</CWText>
              <CWText>Elevation: 1</CWText>
            </CWCard>
            <CWCard
              elevation="elevation-2"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <CWText fontWeight="semiBold">Card title</CWText>
              <CWText>Elevation: 2</CWText>
            </CWCard>
            <CWCard
              elevation="elevation-3"
              interactive={true}
              onclick={() => notifySuccess('Card clicked!')}
            >
              <CWText fontWeight="semiBold">Card title</CWText>
              <CWText>Elevation: 3</CWText>
            </CWCard>
          </div>
          <CWCard
            elevation="elevation-1"
            interactive={true}
            fullWidth={true}
            onclick={() => notifySuccess('Card clicked!')}
          >
            <CWText fontWeight="semiBold">Card title</CWText>
            <CWText>Full width</CWText>
          </CWCard>
        </div>
      </div>
    );
  }
}
