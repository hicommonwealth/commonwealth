import React, { Dispatch, SetStateAction } from 'react';

import './DirectoryPageSection.scss';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { CWTypeaheadSelectList } from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { useCommonNavigate } from 'navigation/helpers';

interface DirectoryPageSectionProps {
  directoryPageEnabled: boolean;
  setDirectoryPageEnabled: Dispatch<SetStateAction<boolean>>;
  isGoToDirectoryButtonVisible: boolean;
}
const DirectoryPageSection = ({
  directoryPageEnabled,
  setDirectoryPageEnabled,
  isGoToDirectoryButtonVisible,
}: DirectoryPageSectionProps) => {
  const navigate = useCommonNavigate();

  const handleGoToDirectory = () => {
    navigate('/directory');
  };

  return (
    <div className="DirectoryPageSection">
      <div className="header">
        <CWText type="h5">Directory page</CWText>
        <CWTag label="New" type="new" iconName="newStar" />
        <CWToggle
          checked={directoryPageEnabled}
          onChange={(e) => {
            setDirectoryPageEnabled(e.target.checked);
          }}
        />
      </div>
      <CWText type="b2">
        Enable your community members to access relevant communities linked to
        your chain on this optional page. Simply toggle on to generate the page
        and make it accessible within the sidebar, or toggle off to hide.
      </CWText>

      {directoryPageEnabled && (
        <>
          <CWLabel label="Enter or select your community's chain" />
          <CWTypeaheadSelectList
            options={[]}
            defaultValue={{ value: 'value', label: 'label' }}
            placeholder="Select community's chain"
          />
        </>
      )}
      {isGoToDirectoryButtonVisible && (
        <CWButton
          buttonType="tertiary"
          buttonHeight="sm"
          label="Go to directory"
          iconRight="arrowRightPhosphor"
          onClick={handleGoToDirectory}
        />
      )}
    </div>
  );
};

export default DirectoryPageSection;
