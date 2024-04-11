import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import useCommunityState from 'views/components/CommunityStake/useCommunityStake';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTypeaheadSelectList } from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';
import './Stake.scss';

const Stake = () => {
  const chainNodes = app.config.nodes.getAll() || [];
  const chainNodeOptions = chainNodes.map((chain) => ({
    value: String(chain.id),
    label: chain.name,
  }));
  const chainNodeOptionsSorted = chainNodeOptions.sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const communityDefaultChainNodeId = app.chain.meta.ChainNode.id;

  const navigate = useCommonNavigate();
  const { stakeEnabled, ethChainId } = useCommunityState();
  const [community] = useState(app.config.chains.getById(app.activeChainId()));
  const [isEnabled, setIsEnabled] = useState(community.directoryPageEnabled);
  const [chainNodeId, setChainNodeId] = useState(
    community.directoryPageChainNodeId,
  );

  const [isSaving, setIsSaving] = useState(false);

  const onChangeStep = (isSuccess: boolean) => {
    if (isSuccess) {
      setIsEnabled(true);
    }
  };

  const createdCommunityid = app.config.chains.getById(app.activeChainId()).id;

  const defaultChainNodeId = chainNodeId ?? communityDefaultChainNodeId;
  const defaultOption = chainNodeOptionsSorted.find(
    (option) => option.value === String(defaultChainNodeId),
  );

  return (
    <>
      <section className="Directory">
        <div className="header">
          <CWText type="h4">Stake</CWText>
        </div>

        <CWText type="b1">
          Community stake allows your community to fundraise via member
          contributions. Community members can make financial contributions in
          exchange for more voting power within the community.
        </CWText>

        {isEnabled && (
          <section className="chains">
            <div>
              <CWLabel label="Enter or select your community's chain" />
              <CWTypeaheadSelectList
                options={chainNodeOptionsSorted}
                defaultValue={defaultOption}
                placeholder="Select community's chain"
                onChange={(selectedOption) =>
                  setChainNodeId(Number(selectedOption.value))
                }
              />
            </div>
          </section>
        )}
        <CWButton
          containerClassName="action-btn"
          buttonType="secondary"
          label="Enable Stake"
          // for prod
          // disabled={stakeEnabled}
          // for testing
          disabled={stakeEnabled}
          onClick={() => navigate('/manage/integrations/stake')}
        />
      </section>
    </>
  );
};

export default Stake;
