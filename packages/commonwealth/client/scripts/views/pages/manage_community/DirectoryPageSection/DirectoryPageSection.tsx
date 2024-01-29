import React, { Dispatch, SetStateAction } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CWTypeaheadSelectList,
  SelectListOption,
} from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './DirectoryPageSection.scss';

interface DirectoryPageSectionProps {
  directoryPageEnabled: boolean;
  setDirectoryPageEnabled: Dispatch<SetStateAction<boolean>>;
  isGoToDirectoryButtonEnabled: boolean;
  selectedChainNodeId: number;
  setSelectedChainNodeId: Dispatch<SetStateAction<number>>;
}
const DirectoryPageSection = ({
  directoryPageEnabled,
  setDirectoryPageEnabled,
  isGoToDirectoryButtonEnabled,
  selectedChainNodeId,
  setSelectedChainNodeId,
}: DirectoryPageSectionProps) => {
  const navigate = useCommonNavigate();

  const handleGoToDirectory = () => {
    navigate('/directory');
  };

  const chainNodes = app.config.nodes.getAll() || [];
  const chainNodeOptions = chainNodes.map((chain) => ({
    value: String(chain.id),
    label: chain.name,
  }));
  const chainNodeOptionsSorted = chainNodeOptions.sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const communityDefaultChainNodeId = app.chain.meta.ChainNode.id;
  const defaultChainNodeId = selectedChainNodeId ?? communityDefaultChainNodeId;
  const defaultOption = chainNodeOptionsSorted.find(
    (option) => option.value === String(defaultChainNodeId),
  );

  const handleSelectChange = (newOption: SelectListOption) => {
    setSelectedChainNodeId(Number(newOption.value));
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
            options={chainNodeOptionsSorted}
            defaultValue={defaultOption}
            placeholder="Select community's chain"
            onChange={handleSelectChange}
          />
        </>
      )}
      {directoryPageEnabled && (
        <CWTooltip
          placement="top"
          content={
            isGoToDirectoryButtonEnabled
              ? null
              : 'Save changes to enable directory page'
          }
          renderTrigger={(handleInteraction) => (
            <div
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
              className="cta-button-container"
            >
              <CWButton
                disabled={!isGoToDirectoryButtonEnabled}
                buttonType="tertiary"
                buttonHeight="sm"
                label="Go to directory"
                iconRight="arrowRightPhosphor"
                onClick={handleGoToDirectory}
              />
            </div>
          )}
        ></CWTooltip>
      )}
    </div>
  );
};

export default DirectoryPageSection;
