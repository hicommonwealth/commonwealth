import { ArrowCircleRight, MagnifyingGlass } from '@phosphor-icons/react';
import React, { useState } from 'react';

import 'components/component_kit/cw_component_showcase.scss';
import 'components/component_kit/new_designs/cw_button.scss';

import { notifySuccess } from 'controllers/app/notifications';
import { CWAccountCreationButton } from './cw_account_creation_button';
import { CWAuthButton } from './cw_auth_button';
import { CWBreadcrumbs } from './cw_breadcrumbs';

import { DeltaStatic } from 'quill';
import app from 'state';
import { SelectList } from 'views/components/component_kit/cw_select_list';
import CWBanner, {
  BannerType,
} from 'views/components/component_kit/new_designs/CWBanner';
import {
  ReactQuillEditor,
  createDeltaFromText,
} from 'views/components/react_quill_editor';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { AvatarUpload } from '../Avatar';
import { CWContentPageCard } from './CWContentPage';
import { CWCard } from './cw_card';
import type { CheckboxType } from './cw_checkbox';
import { CWCheckbox } from './cw_checkbox';
import { CWCollapsible } from './cw_collapsible';
import { CWCoverImageUploader } from './cw_cover_image_uploader';
import { CWDropdown } from './cw_dropdown';
import { CWIconButton } from './cw_icon_button';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { iconLookup } from './cw_icons/cw_icon_lookup';
import { Modal } from './cw_modal';
import { CWAddressTooltip } from './cw_popover/cw_address_tooltip';
import { CWFilterMenu } from './cw_popover/cw_filter_menu';
import type { PopoverMenuItem } from './cw_popover/cw_popover_menu';
import { PopoverMenu } from './cw_popover/cw_popover_menu';
import { CWTooltip as CWTooltipOld } from './cw_popover/cw_tooltip';
import { CWProgressBar } from './cw_progress_bar';
import type { RadioButtonType } from './cw_radio_button';
import { CWRadioButton } from './cw_radio_button';
import { CWRadioGroup } from './cw_radio_group';
import { CWSpinner } from './cw_spinner';
import { CWTab, CWTabBar } from './cw_tabs';
import { CWText } from './cw_text';
import { CWTextArea } from './cw_text_area';
import { CWThreadVoteButton } from './cw_thread_vote_button';
import type { ValidationStatus } from './cw_validation_text';
import { CWSearchBar } from './new_designs/CWSearchBar';
import { CWTextInput } from './new_designs/CWTextInput';
import { CWTooltip } from './new_designs/CWTooltip';
import { CWButton } from './new_designs/cw_button';
import { CWTag } from './new_designs/cw_tag';
import { CWThreadAction } from './new_designs/cw_thread_action';
import { CWToggle, toggleDarkMode } from './new_designs/cw_toggle';
import { CWUpvote } from './new_designs/cw_upvote';

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

const bannerTypes: BannerType[] = [
  'default',
  'info',
  'success',
  'warning',
  'error',
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

const initialBannersState: { [K in BannerType]: boolean } = bannerTypes.reduce(
  (acc, el) => ({ ...acc, [el]: true }),
  {} as { [K in BannerType]: boolean }
);

export const ComponentShowcase = () => {
  const [selectedIconButton, setSelectedIconButton] = useState<
    number | undefined
  >(undefined);
  const [checkboxGroupSelected, setCheckboxGroupSelected] = useState<
    Array<string>
  >([]);
  const [isSmallToggled, setIsSmallToggled] = useState<boolean>(false);
  const [isLargeToggled, setIsLargeToggled] = useState<boolean>(false);
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

  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    createDeltaFromText('')
  );
  const [isEditorDisabled, setIsEditorDisabled] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(initialBannersState);
  const [isAlertVisible, setIsAlertVisible] = useState(initialBannersState);
  const allChains = app.config.chains.getAll();
  const [chainId, setChainId] = useState(allChains[1]);

  return (
    <div className="ComponentShowcase">
      <CWText type="h3">Multi select list</CWText>
      <SelectList
        placeholder="Add or select a chain"
        isMulti
        isClearable={false}
        defaultValue={[{ value: 'solana', label: 'Solana' }]}
        options={[
          { value: 'solana', label: 'Solana' },
          { value: 'polkadot', label: 'Polkadot' },
          { value: 'ethereum', label: 'Ethereum' },
          { value: 'substrate', label: 'Substrate' },
          { value: 'binance', label: 'Binance' },
        ]}
      />
      <div style={{ height: '500px' }} />
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
          <CWTooltipOld
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
          <CWTooltipOld
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
      <div className="tag-gallery">
        <CWText type="h3">Tags</CWText>
        <div className="tag-row">
          <CWText type="h4">Spam Tag</CWText>
          <CWTag label="SPAM" type="spam" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Status Tags</CWText>
          <CWTag label="New" type="new" iconName="newStar" />
          <CWTag label="Trending" type="trending" iconName="trendUp" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Elements Tags</CWText>
          <CWTag label="Poll" type="poll" />
          <CWTag label="Snapshot" type="active" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Stage Tags</CWText>
          <CWTag label="Stage 1" type="new-stage" classNames="rorange-600" />
          <CWTag label="Stage 2" type="new-stage" classNames="rorange-400" />
          <CWTag label="Stage 3" type="new-stage" classNames="yellow-500" />
          <CWTag label="Stage 4" type="new-stage" classNames="green-600" />
          <CWTag label="Stage 5" type="new-stage" classNames="green-500" />
          <CWTag label="Stage 6" type="new-stage" classNames="primary-600" />
          <CWTag label="Stage 7" type="new-stage" classNames="primary-400" />
          <CWTag label="Stage 8" type="new-stage" classNames="purple-600" />
          <CWTag label="Stage 9" type="new-stage" classNames="purple-400" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Proposal Tag</CWText>
          <CWTag label="Proposal" type="proposal" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Input Tag</CWText>
          {chainId && (
            <CWTag
              label={allChains[1].name}
              type="input"
              community={allChains[1]}
              onClick={() => setChainId(null)}
            />
          )}
        </div>
        <div className="tag-row">
          <CWText type="h4">Login User Tag</CWText>
          <CWTag label="mnh7a" type="login" loginIcon="cosmos" />
          <CWTag label="mnh7a" type="login" loginIcon="discordLogin" />
          <CWTag label="mnh7a" type="login" loginIcon="envelope" />
          <CWTag label="mnh7a" type="login" loginIcon="ethereum" />
          <CWTag label="mnh7a" type="login" loginIcon="octocat" />
          <CWTag label="mnh7a" type="login" loginIcon="near" />
          <CWTag label="mnh7a" type="login" loginIcon="polkadot" />
          <CWTag label="mnh7a" type="login" loginIcon="polygon" />
          <CWTag label="mnh7a" type="login" loginIcon="twitterNew" />
        </div>
        <div className="tag-row">
          <CWText type="h4">Address Tags</CWText>
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="cosmos" />
          <CWTag
            label="0xd83e1...a39bD"
            type="address"
            loginIcon="discordLogin"
          />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="envelope" />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="ethereum" />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="octocat" />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="near" />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="polkadot" />
          <CWTag label="0xd83e1...a39bD" type="address" loginIcon="polygon" />
          <CWTag
            label="0xd83e1...a39bD"
            type="address"
            loginIcon="twitterNew"
          />
        </div>
      </div>
      <div className="button-gallery">
        <CWText type="h3">Buttons</CWText>
        <div className="button-row">
          <CWText type="h4">Primary</CWText>
          <CWButton
            buttonType="primary"
            label="Primary default"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            buttonHeight="lg"
            label="Primary large"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            buttonWidth="wide"
            label="Primary wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            buttonHeight="lg"
            buttonWidth="wide"
            label="Primary large and wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="person"
            buttonType="primary"
            label="Primary default w/ left icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            buttonWidth="full"
            label="Primary full"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            label="Primary default disabled"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="person"
            buttonType="primary"
            label="Primary default disabled w/ left icon"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="primary"
            buttonWidth="full"
            label="Primary disabled full"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWText type="h4">Secondary</CWText>
          <CWButton
            buttonType="secondary"
            label="Secondary default"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            buttonHeight="lg"
            label="Secondary large"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            buttonWidth="wide"
            label="Secondary wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            buttonHeight="lg"
            buttonWidth="wide"
            label="Secondary large and wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="person"
            buttonType="secondary"
            label="Secondary default w/ left icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            buttonWidth="full"
            label="Secondary full"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            label="Secondary default disabled"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="person"
            label="Secondary default disabled w/ left icon"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="secondary"
            buttonWidth="full"
            label="Secondary disabled full"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWText type="h4">Tertiary</CWText>
          <CWButton
            buttonType="tertiary"
            label="Tertiary default"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            buttonHeight="lg"
            label="Tertiary large"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            buttonWidth="wide"
            label="Tertiary wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            buttonHeight="lg"
            buttonWidth="wide"
            label="Tertiary large and wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="person"
            buttonType="tertiary"
            label="Tertiary default w/ left icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            buttonWidth="full"
            label="Tertiary full"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            label="Tertiary default disabled"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            iconLeft="person"
            label="Tertiary default disabled w/ left icon"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="tertiary"
            buttonWidth="full"
            label="Tertiary disabled full"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
        </div>
        <div className="button-row">
          <CWText type="h4">Destructive</CWText>
          <CWButton
            buttonType="destructive"
            label="Destructive default"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            buttonHeight="lg"
            label="Destructive large"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            buttonWidth="wide"
            label="Destructive wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            buttonHeight="lg"
            buttonWidth="wide"
            label="Destructive large and wide"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            iconLeft="trash"
            buttonType="destructive"
            label="Destructive default w/ left icon"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            buttonWidth="full"
            label="Destructive full"
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            label="Destructive default disabled"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            iconLeft="trash"
            label="Destructive default disabled w/ left icon"
            disabled
            onClick={() => notifySuccess('Button clicked!')}
          />
          <CWButton
            buttonType="destructive"
            buttonWidth="full"
            label="Destructive disabled full"
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
            checked={isSmallToggled}
            size="small"
            onChange={() => {
              setIsSmallToggled(!isSmallToggled);
            }}
          />
          <div className="toggle-label">
            <CWText type="caption">Small</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle
            checked={isDarkModeOn}
            size="small"
            onChange={(e) => {
              isDarkModeOn
                ? toggleDarkMode(false, setIsDarkModeOn)
                : toggleDarkMode(true, setIsDarkModeOn);
              e.stopPropagation();
            }}
          />
          <div className="toggle-label">
            <CWText type="caption">Small Dark mode</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle size="small" disabled />
          <div className="toggle-label">
            <CWText type="caption">Small disabled unchecked</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle size="small" checked disabled />
          <div className="toggle-label">
            <CWText type="caption">Small disabled checked</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle
            checked={isLargeToggled}
            size="large"
            onChange={() => {
              setIsLargeToggled(!isLargeToggled);
            }}
          />
          <div className="toggle-label">
            <CWText type="caption">Large</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle
            checked={isDarkModeOn}
            size="large"
            onChange={(e) => {
              isDarkModeOn
                ? toggleDarkMode(false, setIsDarkModeOn)
                : toggleDarkMode(true, setIsDarkModeOn);
              e.stopPropagation();
            }}
          />
          <div className="toggle-label">
            <CWText type="caption">Large Dark mode</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle size="large" disabled />
          <div className="toggle-label">
            <CWText type="caption">Large disabled unchecked</CWText>
          </div>
        </div>
        <div className="toggle-gallery">
          <CWToggle size="large" checked disabled />
          <div className="toggle-label">
            <CWText type="caption">Large disabled checked</CWText>
          </div>
        </div>
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
        <CWAuthButton
          type="metamask"
          onClick={() => notifySuccess('MetaMask clicked!')}
        />
        <CWAuthButton
          darkMode
          type="metamask"
          onClick={() => notifySuccess('MetaMask clicked!')}
        />
      </div>
      <div className="form-gallery">
        <CWText type="h3">Form fields</CWText>
        <CWText type="h5">isCompact = Yes</CWText>
        <CWTextInput
          name="Text field"
          label="Text Input with default width of 240 px"
          placeholder="Placeholder"
          isCompact
        />
        <div className="custom-width-1">
          <CWTextInput
            name="Text field"
            label="Custom width of 250 px"
            placeholder="Placeholder"
            isCompact
            fullWidth
          />
        </div>
        <div className="custom-width-2">
          <CWTextInput
            name="Text field"
            label="Custom width of 275 px"
            placeholder="Placeholder"
            isCompact
            fullWidth
          />
        </div>
        <div className="custom-width-3">
          <CWTextInput
            name="Text field"
            label="Custom width of 300 px"
            placeholder="Placeholder"
            isCompact
            fullWidth
          />
        </div>
        <CWTextInput
          name="Text field"
          label="Full width"
          placeholder="Placeholder"
          isCompact
          fullWidth
        />
        <CWTextInput
          name="Text field"
          label="Text Input with instructional message"
          placeholder="Placeholder"
          isCompact
          instructionalMessage="Instructional message"
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
          isCompact
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
          isCompact
          instructionalMessage="Instructional message"
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          isCompact
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          isCompact
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          isCompact
        />
        <CWTextInput
          label="Text field with icons fullWidth"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          isCompact
          fullWidth
        />
        <CWTextInput
          name="Text field"
          label="Disabled"
          disabled
          value="Some disabled text"
          isCompact
        />
        <CWTextInput
          name="Text field dark mode"
          label="Dark mode"
          darkMode
          placeholder="Type here"
          isCompact
        />
        <CWText type="h5">isCompact = No</CWText>
        <CWTextInput
          name="Text field"
          label="Text Input with default width of 240 px"
          placeholder="Placeholder"
        />
        <div className="custom-width-1">
          <CWTextInput
            name="Text field"
            label="Custom width of 250 px"
            placeholder="Placeholder"
            fullWidth
          />
        </div>
        <div className="custom-width-2">
          <CWTextInput
            name="Text field"
            label="Custom width of 275 px"
            placeholder="Placeholder"
            fullWidth
          />
        </div>
        <div className="custom-width-3">
          <CWTextInput
            name="Text field"
            label="Custom width of 300 px"
            placeholder="Placeholder"
            fullWidth
          />
        </div>
        <CWTextInput
          name="Text field"
          label="Full width"
          placeholder="Placeholder"
          fullWidth
        />
        <CWTextInput
          name="Text field"
          label="Text Input with instructional message"
          placeholder="Placeholder"
          instructionalMessage="Instructional message"
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
          instructionalMessage="Instructional message"
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
        />
        <CWTextInput
          label="Text field with icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
        />
        <CWTextInput
          label="Text field with icons fullWidth"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          fullWidth
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
          placeholder="Placeholder"
        />
        <CWTextArea
          name="Textarea"
          label="Text area"
          placeholder="Placeholder"
          disabled
        />
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
        <div className="thread-actions-gallery">
          <CWText type="h3">Thread Actions</CWText>
          <CWText type="h5">Default</CWText>
          <CWThreadAction
            action="comment"
            onClick={() => console.log('Comment action clicked!')}
          />
          <CWThreadAction
            action="share"
            onClick={() => console.log('Share action clicked!')}
          />
          <CWThreadAction
            action="subscribe"
            onClick={() => console.log('Subscribe action clicked!')}
          />
          <CWThreadAction
            action="upvote"
            onClick={() => console.log('Upvote action clicked!')}
          />
          <CWThreadAction
            action="overflow"
            onClick={() => console.log('Overflow action clicked!')}
          />
          <CWText type="h5">Disabled</CWText>
          <CWThreadAction
            action="comment"
            onClick={() => console.log('Comment action clicked!')}
            disabled
          />
          <CWThreadAction
            action="share"
            onClick={() => console.log('Share action clicked!')}
            disabled
          />
          <CWThreadAction
            action="subscribe"
            onClick={() => console.log('Subscribe action clicked!')}
            disabled
          />
          <CWThreadAction
            action="upvote"
            onClick={() => console.log('Upvote action clicked!')}
            disabled
          />
          <CWThreadAction
            action="overflow"
            onClick={() => console.log('Overflow action clicked!')}
            disabled
          />
        </div>
      </div>
      <div className="upvote-gallery">
        <CWText type="h3">Upvote</CWText>
        <div className="upvote-row">
          <CWText>Default</CWText>
          <CWUpvote voteCount={87} />
        </div>
        <div className="upvote-row">
          <CWText>Active</CWText>
          <CWUpvote voteCount={8887} active />
        </div>
        <div className="upvote-row">
          <CWText>Disabled</CWText>
          <CWUpvote voteCount={99999} disabled />
        </div>
      </div>
      <div className="searchbar-gallery">
        <CWText type="h3">SearchBar</CWText>
        <CWSearchBar />
      </div>
      <div className="Quill">
        <CWText type="h3">Quill Editor</CWText>
        <div className="editor-toggle">
          <CWToggle
            size="small"
            checked={isEditorDisabled}
            onChange={() => {
              setIsEditorDisabled((prev) => !prev);
            }}
          />
          <CWText type="caption">
            Editor {isEditorDisabled ? 'Disabled' : 'Enabled'}
          </CWText>
        </div>
        <ReactQuillEditor
          contentDelta={threadContentDelta}
          setContentDelta={setThreadContentDelta}
          isDisabled={isEditorDisabled}
        />
      </div>
      <div className="banners">
        <CWText type="h3">Banners</CWText>
        <CWButton
          buttonHeight="sm"
          label="Restore all banners"
          onClick={() => setIsBannerVisible(initialBannersState)}
        />
        <div className="container">
          {bannerTypes.map((bannerType, i) => {
            if (!isBannerVisible[bannerType]) {
              return null;
            }

            return (
              <CWBanner
                key={i}
                type={bannerType}
                title="Default banner"
                body="This is banner body with custom message"
                buttons={[{ label: 'Primary' }, { label: 'Secondary' }]}
                onClose={() => {
                  setIsBannerVisible((prevState) => ({
                    ...prevState,
                    [bannerType]: false,
                  }));
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="alerts">
        <CWText type="h3">Alerts</CWText>
        <CWButton
          buttonHeight="sm"
          label="Restore all alerts"
          onClick={() => setIsAlertVisible(initialBannersState)}
        />
        <div className="container">
          {bannerTypes.map((bannerType, i) => {
            if (!isAlertVisible[bannerType]) {
              return null;
            }

            return (
              <CWBanner
                key={i}
                type={bannerType}
                title="Default alert"
                body="This is alert body with custom message"
                onClose={() => {
                  setIsAlertVisible((prevState) => ({
                    ...prevState,
                    [bannerType]: false,
                  }));
                }}
              />
            );
          })}
        </div>
      </div>
      <CWText type="h3">Tooltip</CWText>
      <div className="tooltip">
        <CWTooltip
          content="Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects together. Never miss an on-chain event, proposal, or important discussion again."
          placement="top"
          renderTrigger={(handleInteraction) => (
            <CWText
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              Commonwealth
            </CWText>
          )}
        />
        <CWTooltip
          content="A tooltip is a non-actionable label for explaining a UI element or feature."
          placement="top"
          renderTrigger={(handleInteraction) => (
            <CWIcon
              iconName="infoEmpty"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content="Commonwealth labs"
          placement="top"
          renderTrigger={(handleInteraction) => (
            <CWButton
              label="top"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper justo eget facilisis auctor. Mauris consequat arcu non est semper vestibulum. Nulla nec porta nisi. Nullam eu erat vel arcu finibus imperdiet nec eget mi. Pellentesque enim nibh, consequat eu urna id, rhoncus porta metus. Vestibulum hendrerit felis urna, in tempor purus lobortis sit amet. Etiam pulvinar nisl eu enim laoreet tristique. Nam semper venenatis massa vel finibus."
          placement="right"
          renderTrigger={(handleInteraction) => (
            <CWButton
              label="right"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content="A tooltip is a non-actionable label for explaining a UI element or feature."
          placement="bottom"
          renderTrigger={(handleInteraction) => (
            <CWButton
              label="bottom"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content="A tooltip is a non-actionable label for explaining a UI element or feature."
          placement="left"
          renderTrigger={(handleInteraction) => (
            <CWButton
              label="left"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
      </div>
    </div>
  );
};
