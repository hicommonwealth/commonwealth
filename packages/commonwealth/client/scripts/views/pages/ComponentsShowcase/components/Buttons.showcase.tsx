import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

const ButtonsShowcase = () => {
  return (
    <>
      <CWText type="h5">Size (height)</CWText>
      <div className="flex-row">
        <CWButton buttonHeight="sm" label="Small" />
        <CWButton buttonHeight="med" label="Medium" />
        <CWButton buttonHeight="lg" label="Large" />
      </div>

      <CWText type="h5">Size (width)</CWText>
      <div className="flex-row">
        <CWButton buttonWidth="narrow" label="Narrow" />
        <CWButton buttonWidth="wide" label="Wide" />
        <CWButton buttonWidth="full" label="Full" />
      </div>

      <CWText type="h5">Icon</CWText>
      <div className="flex-row">
        <CWButton iconLeft="linkPhosphor" label="Left" />
        <CWButton iconRight="magnifyingGlass" label="Right" />
        <CWButton
          iconLeft="linkPhosphor"
          iconRight="magnifyingGlass"
          label="Left & Right"
        />
      </div>

      <CWText type="h5">Type</CWText>
      <div className="flex-row">
        <CWButton buttonType="primary" label="Primary" />
        <CWButton buttonType="secondary" label="Secondary" />
        <CWButton buttonType="tertiary" label="Tertiary" />
        <CWButton buttonType="destructive" label="Destructive" />
      </div>

      <div className="flex-row">
        <CWButton
          buttonType="primary"
          buttonAlt="green"
          label="Primary green"
        />
        <CWButton
          buttonType="primary"
          buttonAlt="rorange"
          label="Primary Rorange"
        />

        <CWButton
          buttonType="secondary"
          buttonAlt="green"
          label="Secondary green"
        />
        <CWButton
          buttonType="secondary"
          buttonAlt="rorange"
          label="Secondary Rorange"
        />
      </div>

      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWButton buttonType="primary" label="Primary" disabled />
        <CWButton buttonType="secondary" label="Secondary" disabled />
        <CWButton buttonType="tertiary" label="Tertiary" disabled />
        <CWButton buttonType="destructive" label="Destructive" disabled />
      </div>

      <div className="flex-row">
        <CWButton
          buttonType="primary"
          buttonAlt="green"
          label="Primary green"
          disabled
        />
        <CWButton
          buttonType="primary"
          buttonAlt="rorange"
          label="Primary Rorange"
          disabled
        />

        <CWButton
          buttonType="secondary"
          buttonAlt="green"
          label="Secondary green"
          disabled
        />
        <CWButton
          buttonType="secondary"
          buttonAlt="rorange"
          label="Secondary Rorange"
          disabled
        />
      </div>
    </>
  );
};

export default ButtonsShowcase;
