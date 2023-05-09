import React, { useState } from 'react';

import 'components/component_kit/cw_component_showcase.scss';

import { notifySuccess } from 'controllers/app/notifications';
import { CWWalletOptionRow } from './cw_wallet_option_row';
import { CWAccountCreationButton } from './cw_account_creation_button';
import { CWBreadcrumbs } from './cw_breadcrumbs';

import { CWButton } from './cw_button';
import { CWCard } from './cw_card';
import type { CheckboxType } from './cw_checkbox';
import { CWCheckbox } from './cw_checkbox';
import { CWIconButton } from './cw_icon_button';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { iconLookup } from './cw_icons/cw_icon_lookup';
import { CWAddressTooltip } from './cw_popover/cw_address_tooltip';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { CWProgressBar } from './cw_progress_bar';
import { CWRadioGroup } from './cw_radio_group';
import { CWTab, CWTabBar } from './cw_tabs';
import { CWTextArea } from './cw_text_area';
import { CWTextInput } from './cw_text_input';
import { CWThreadVoteButton } from './cw_thread_vote_button';
import { CWToggle, toggleDarkMode } from './cw_toggle';
import { PopoverMenu } from './cw_popover/cw_popover_menu';
import type { PopoverMenuItem } from './cw_popover/cw_popover_menu';
import { CWCollapsible } from './cw_collapsible';
import { CWTag } from './cw_tag';
import { CWSpinner } from './cw_spinner';
import { CWDropdown } from './cw_dropdown';
import { CWRadioButton } from './cw_radio_button';
import type { RadioButtonType } from './cw_radio_button';
import { CWContentPageCard } from './cw_content_page';
import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { CWFilterMenu } from './cw_popover/cw_filter_menu';
import { CWCoverImageUploader } from './cw_cover_image_uploader';
import { Modal } from './cw_modal';
import type { ValidationStatus } from './cw_validation_text';
import { AvatarUpload } from '../avatar_upload';
import { openConfirmation } from 'views/modals/confirmation_modal';

const displayIcons = (icons) => {
  return Object.entries(icons).map(([k], i) => {
    return (
      <div className="icon-container" key={i}>
        <div className="icon-name">{k}</div>
        <CWIcon iconName={k as IconName} />
      </div>
    );
  });
};

const radioGroupOptions: Array<RadioButtonType> = [
  { label: 'This', value: 'This' },
  { label: 'Is', value: 'Is' },
  { label: 'A', value: 'A' },
  { label: 'Radio', value: 'Radio' },
  { label: 'Group', value: 'Group' },
];

const checkboxGroupOptions: Array<CheckboxType> = [
  {
    label: 'Discussion',
    value: 'discussion',
  },
  {
    label: 'Pre Voting',
    value: 'preVoting',
  },
  {
    label: 'In Voting',
    value: 'inVoting',
  },
  {
    label: 'Passed',
    value: 'passed',
  },
  {
    label: 'Failed',
    value: 'failed',
  },
];

const popoverMenuOptions = (): Array<PopoverMenuItem> => {
  return [
    { type: 'header', label: 'Community' },
    {
      type: 'default',
      label: 'Create Thread',
      iconLeft: 'write',
      onClick: () => console.log('Create thread clicked'),
    },
    {
      label: 'Create Proposal',
      iconLeft: 'write',
      onClick: () => console.log('Create proposal clicked'),
    },
    {
      label: 'Create Poll',
      iconLeft: 'write',
      onClick: () => console.log('Create poll clicked'),
    },
    {
      label: 'Create Snapshot',
      iconLeft: 'write',
      disabled: true,
      onClick: () => console.log('Create snapshot clicked'),
    },
    { type: 'divider' },
    { type: 'header', label: 'Universal' },
    {
      label: 'Create Community',
      iconLeft: 'people',
      onClick: () => console.log('Create community clicked'),
    },
    {
      label: 'Create Crowdfund',
      iconLeft: 'wallet',
      onClick: () => console.log('Create crowdfund clicked'),
    },
    { type: 'divider' },
    {
      label: 'Report',
      iconLeft: 'cautionCircle',
      isSecondary: true,
      onClick: () => console.log('Report clicked'),
    },
  ];
};

export const ComponentShowcase = () => {
  const [selectedIconButton, setSelectedIconButton] = useState<
    number | undefined
  >(undefined);
  const [checkboxGroupSelected, setCheckboxGroupSelected] = useState<
    Array<string>
  >([]);
  const [isToggled, setIsToggled] = useState<boolean>(false);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<number>(1);
  const [isRadioButtonChecked, setIsRadioButtonChecked] =
    useState<boolean>(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState<boolean>(false);
  const [radioGroupSelection, setRadioGroupSelection] = useState<string>(
    radioGroupOptions[2].value
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] =
    useState<boolean>(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );

  return (
    <div className="ComponentShowcase">
      <AvatarUpload scope="community" />
      <AvatarUpload size="large" scope="community" />
      <CWButton label="Modal" onClick={() => setIsModalOpen(true)} />
      <Modal
        content={<div>hi</div>}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <CWButton label="Toast" onClick={() => notifySuccess('message')} />
      <CWButton
        label="Full Screen Modal"
        onClick={() => setIsFullScreenModalOpen(true)}
      />
      <CWButton
        label="Confirmation Modal"
        onClick={() =>
          openConfirmation({
            title: 'Warning',
            description: (
              <>
                Do you really want to <b>delete</b> this item?
              </>
            ),
            buttons: [
              {
                label: 'Delete',
                buttonType: 'mini-black',
                onClick: () => {
                  notifySuccess('Deleted');
                },
              },
              {
                label: 'Cancel',
                buttonType: 'mini-white',
                onClick: () => {
                  console.log('cancelled');
                },
              },
            ],
          })
        }
      />

      <Modal
        content={
          <div>
            <CWText>hi</CWText>
            <CWIconButton
              iconName="close"
              onClick={() => setIsFullScreenModalOpen(false)}
            />
          </div>
        }
        isFullScreen
        onClose={() => setIsFullScreenModalOpen(false)}
        open={isFullScreenModalOpen}
      />
      <div className="basic-gallery">
        <CWText type="h3">Popover Menu</CWText>
        <PopoverMenu
          menuItems={popoverMenuOptions()}
          renderTrigger={(onclick) => (
            <CWIconButton iconName="plusCircle" onClick={onclick} />
          )}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Filter Menu</CWText>
        <CWFilterMenu
          header="Stages"
          filterMenuItems={checkboxGroupOptions}
          selectedItems={checkboxGroupSelected}
          onChange={(e) => {
            const itemValue = e.target.value;
            if (checkboxGroupSelected.indexOf(itemValue) === -1) {
              checkboxGroupSelected.push(itemValue);
            } else {
              setCheckboxGroupSelected(
                checkboxGroupSelected.filter((item) => item !== itemValue)
              );
            }
          }}
        />
      </div>
      <div className="tooltip-gallery">
        <CWText type="h3">Tooltips</CWText>
        <div className="tooltip-row">
          <CWText>Default</CWText>
          <CWTooltip
            content={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
            renderTrigger={(handleInteraction) => (
              <CWIcon
                iconName="infoEmpty"
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              />
            )}
          />
        </div>
        <div className="tooltip-row">
          <CWText>Solid background</CWText>
          <CWTooltip
            content={`
                I am an informational tool tip here to provide \
                extra details on things people may need more help on.
              `}
            hasBackground
            renderTrigger={(handleInteraction) => (
              <CWIcon
                iconName="infoEmpty"
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              />
            )}
          />
        </div>
        <div className="tooltip-row">
          <CWText>Address tooltip</CWText>
          <CWAddressTooltip
            address="0xa5430730f12f1128bf10dfba38c8e00bc4d90eea"
            renderTrigger={(handleInteraction) => (
              <CWIconButton iconName="infoEmpty" onClick={handleInteraction} />
            )}
          />
        </div>
      </div>
      <div className="icon-gallery">
        <CWText type="h3">Icons</CWText>
        <div className="all-icons-container">{displayIcons(iconLookup)}</div>
        <div className="icon-row">
          <CWText>Small</CWText>
          <CWIcon iconName="views" iconSize="small" />
        </div>
        <div className="icon-row">
          <CWText>Medium</CWText>
          <CWIcon iconName="views" />
        </div>
        <div className="icon-row">
          <CWText>Large</CWText>
          <CWIcon iconName="views" iconSize="large" />
        </div>
        <div className="icon-row">
          <CWText>Disabled Large</CWText>
          <CWIcon iconName="views" iconSize="large" disabled />
        </div>
      </div>
      <div className="icon-button-gallery">
        <CWText type="h3">Icon Buttons</CWText>
        <CWText>Click to see selected state</CWText>
        <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="primary"
            selected={selectedIconButton === 1}
            onClick={() => {
              setSelectedIconButton(1);
            }}
          />
          {selectedIconButton === 1 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
        <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="neutral"
            selected={selectedIconButton === 2}
            onClick={() => {
              setSelectedIconButton(2);
            }}
          />
          {selectedIconButton === 2 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
        <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="black"
            selected={selectedIconButton === 3}
            onClick={() => {
              setSelectedIconButton(3);
            }}
          />
          {selectedIconButton === 3 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
      </div>
      <div className="text-gallery">
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
        <div className="text-row">
          <CWText type="h3">Disabled</CWText>
          <CWText type="h3" disabled={true}>
            Body1 disabled
          </CWText>
        </div>
        <div className="text-row">
          <CWText type="h3">Overflow</CWText>
          <div className="ellipsis-row">
            <CWText type="h3" noWrap>
              Body1 noWrap
            </CWText>
          </div>
        </div>
      </div>
      <div className="button-gallery">
        <CWText type="h3">Buttons</CWText>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            buttonType="primary-red"
            label="Primary red with icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary-blue"
            label="Primary blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary-black"
            label="Primary black"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Primary disabled"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            label="Secondary red with icon"
            buttonType="secondary-red"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary blue"
            buttonType="secondary-blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary black"
            buttonType="secondary-black"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary disabled"
            buttonType="secondary-blue"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            label="Tertiary blue with icon"
            buttonType="tertiary-blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Tertiary black"
            buttonType="tertiary-black"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Tertiary disabled"
            buttonType="tertiary-black"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            label="Large primary red with icon"
            buttonType="lg-primary-red"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large primary blue"
            buttonType="lg-primary-blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large primary blue"
            buttonType="lg-primary-blue"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            label="Large secondary red with icon"
            buttonType="lg-secondary-red"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large secondary blue"
            buttonType="lg-secondary-blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large secondary disabled"
            buttonType="lg-secondary-blue"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            label="Large tertiary red with icon"
            buttonType="lg-tertiary-red"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large tertiary blue"
            buttonType="lg-tertiary-blue"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Large tertiary disabled"
            buttonType="lg-tertiary-blue"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            label="Primary blue dark disabled"
            buttonType="primary-blue-dark"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Secondary blue dark disabled"
            buttonType="secondary-blue-dark"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            buttonType="mini-black"
            label="Mini with icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Mini"
            buttonType="mini-black"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Mini Disabled"
            buttonType="mini-black"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWButton
            iconLeft="person"
            buttonType="mini-white"
            label="Mini white with icons"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Mini white"
            buttonType="mini-white"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            label="Mini white disabled"
            buttonType="mini-white"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
      </div>
      <div className="basic-gallery">
        <CWText type="h4">Content Page Card</CWText>
        <CWContentPageCard
          header="Information"
          content={
            <div style={{ padding: '16px' }}>
              <CWText>Content page card content</CWText>
            </div>
          }
        />
      </div>
      <div className="form-gallery">
        <CWText type="h4">Dropdown</CWText>
        <CWDropdown
          label="Dropdown"
          options={[
            { label: 'Dropdown Option 1', value: 'dropdownOption1' },
            { label: 'Dropdown Option 2', value: 'dropdownOption2' },
            { label: 'Dropdown Option 3', value: 'dropdownOption3' },
          ]}
          onSelect={(item) => console.log('Selected option: ', item.label)}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Spinner</CWText>
        <CWSpinner />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Breadcrumbs</CWText>
        <CWBreadcrumbs
          breadcrumbs={[
            { label: 'Page' },
            { label: 'Page' },
            { label: 'Page' },
            { label: 'Current' },
          ]}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Tag</CWText>
        <CWTag label="Ref #90" />
        <CWTag label="Passed" type="passed" />
        <CWTag label="Failed" type="failed" />
        <CWTag label="Active" type="active" />
        <CWTag label="Poll" type="poll" />
        <CWTag label="Prop #52" type="proposal" />
        <CWTag label="Ref #90" type="referendum" />
        <CWTag label="12 days" iconName="clock" />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Collapsible</CWText>
        <CWCollapsible
          headerContent={<CWText>Header content</CWText>}
          collapsibleContent={<CWText>Body content</CWText>}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Toggle</CWText>
        <div className="toggle-gallery">
          <CWToggle
            checked={isDarkModeOn}
            onChange={(e) => {
              isDarkModeOn
                ? toggleDarkMode(false, setIsDarkModeOn)
                : toggleDarkMode(true, setIsDarkModeOn);
              e.stopPropagation();
            }}
          />
          <div className="toggle-label">
            <CWText type="caption">Dark mode</CWText>
          </div>
        </div>
        <CWToggle
          checked={isToggled}
          onChange={() => {
            setIsToggled(!isToggled);
          }}
        />
        <CWToggle disabled />
        <CWToggle checked disabled />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Vote Button</CWText>
        <CWThreadVoteButton
          updateVoteCount={(newCount: number) => {
            setVoteCount(newCount);
          }}
          voteCount={voteCount}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Tabs</CWText>
        <CWTabBar>
          <CWTab
            label="A tab"
            onClick={() => {
              setSelectedTab(1);
            }}
            isSelected={selectedTab === 1}
          />
          <CWTab
            label="Another tab"
            onClick={() => {
              setSelectedTab(2);
            }}
            isSelected={selectedTab === 2}
          />
          <CWTab
            label="Yet another tab"
            onClick={() => {
              setSelectedTab(3);
            }}
            isSelected={selectedTab === 3}
          />
        </CWTabBar>
      </div>
      <div className="progress-gallery">
        <CWText type="h3">Progress Bars</CWText>
        <CWProgressBar
          progress={75}
          label="Progress Bar (Success)"
          progressStatus="passed"
        />
        <CWProgressBar
          progress={75}
          label="Progress Bar (Success) with Check"
          progressStatus="passed"
          iconName="check"
        />
        <CWProgressBar
          progress={100}
          label="Progress Bar (Selected)"
          progressStatus="selected"
        />
        <CWProgressBar
          progress={150}
          label="Progress Bar (Neutral) With Token"
          progressStatus="neutral"
          subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
        />
        <CWProgressBar
          progress={75}
          label="Progress Bar (Ongoing) With Token"
          progressStatus="ongoing"
          subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
        />
      </div>
      <div className="card-gallery">
        <CWText type="h3">Account Creation Button</CWText>
        <CWAccountCreationButton
          onClick={() => notifySuccess('Account creation button clicked!')}
        />
      </div>
      <div className="basic-gallery">
        <CWText type="h3">Wallet Row Card</CWText>
        <CWWalletOptionRow
          walletName="metamask"
          onClick={() => notifySuccess('MetaMask clicked!')}
        />
        <CWWalletOptionRow
          darkMode
          walletName="metamask"
          onClick={() => notifySuccess('MetaMask clicked!')}
        />
      </div>
      <div className="form-gallery">
        <CWText type="h3">Form fields</CWText>
        <CWTextInput name="Text field" label="Large" placeholder="Type here" />
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
          label="Text field with icons"
          name="Text field with icons"
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
        <CWTextArea name="Textarea" label="Text area" placeholder="Type here" />
        <CWCoverImageUploader
          uploadCompleteCallback={(url: string) => {
            notifySuccess(`Image uploaded to ${url.slice(0, 18)}...`);
          }}
          enableGenerativeAI
        />
      </div>
      <div className="choice-gallery">
        <CWText type="h3">Radio Button</CWText>
        <CWRadioButton
          value="Radio Button"
          label="Radio Button"
          checked={isRadioButtonChecked === true}
          onChange={() => {
            setIsRadioButtonChecked(true);
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
      <div className="button-gallery">
        <CWText type="h3">Radio Group</CWText>
        <CWRadioGroup
          options={radioGroupOptions}
          name="RadioGroup"
          toggledOption={radioGroupSelection}
          onChange={(e) => {
            setRadioGroupSelection(e.target.value);
            notifySuccess(`"${e.target.value}" selected`);
          }}
        />
      </div>
      <div className="choice-gallery">
        <CWText type="h3">Checkbox</CWText>
        <CWCheckbox
          checked={isCheckboxChecked}
          label="Click me"
          onChange={() => {
            setIsCheckboxChecked(!isCheckboxChecked);
          }}
        />
        <CWCheckbox label="Disabled" disabled />
        <CWCheckbox label="Checked and disabled" disabled checked />
        <CWCheckbox label="Indeterminate" indeterminate />
        <CWCheckbox label="Indeterminate and disabled" disabled indeterminate />
      </div>
      <div className="card-gallery">
        <CWText type="h3">Cards</CWText>
        <div className="top-card-row">
          <CWCard
            elevation="elevation-1"
            interactive
            onClick={() => notifySuccess('Card clicked!')}
          >
            <CWText fontWeight="semiBold">Card title</CWText>
            <CWText>Elevation: 1</CWText>
          </CWCard>
          <CWCard
            elevation="elevation-2"
            interactive
            onClick={() => notifySuccess('Card clicked!')}
          >
            <CWText fontWeight="semiBold">Card title</CWText>
            <CWText>Elevation: 2</CWText>
          </CWCard>
          <CWCard
            elevation="elevation-3"
            interactive
            onClick={() => notifySuccess('Card clicked!')}
          >
            <CWText fontWeight="semiBold">Card title</CWText>
            <CWText>Elevation: 3</CWText>
          </CWCard>
        </div>
        <CWCard
          elevation="elevation-1"
          interactive
          fullWidth
          onClick={() => notifySuccess('Card clicked!')}
        >
          <CWText fontWeight="semiBold">Card title</CWText>
          <CWText>Full width</CWText>
        </CWCard>
      </div>
    </div>
  );
};
