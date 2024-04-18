import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWTypeaheadSelectList } from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';
import './Directory.scss';

const Directory = () => {
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
  const [community] = useState(app.config.chains.getById(app.activeChainId()));
  const [isEnabled, setIsEnabled] = useState(community.directoryPageEnabled);
  const [chainNodeId, setChainNodeId] = useState(
    community.directoryPageChainNodeId,
  );
  const [isSaving, setIsSaving] = useState(false);

  const defaultChainNodeId = chainNodeId ?? communityDefaultChainNodeId;
  const defaultOption = chainNodeOptionsSorted.find(
    (option) => option.value === String(defaultChainNodeId),
  );

  const onSaveChanges = useCallback(async () => {
    if (
      isSaving ||
      (isEnabled === community.directoryPageEnabled &&
        chainNodeId === community.directoryPageChainNodeId)
    )
      return;

    try {
      setIsSaving(true);
      await community.updateChainData({
        directory_page_enabled: isEnabled,
        directory_page_chain_node_id: chainNodeId,
      });

      notifySuccess('Updated community directory');
      app.sidebarRedraw.emit('redraw');
    } catch {
      notifyError('Failed to update community directory!');
    } finally {
      setIsSaving(false);
    }
  }, [community, isEnabled, chainNodeId, isSaving]);

  return (
    <section className="Directory">
      <div className="header">
        <CWText type="h4">Show Directory Page</CWText>
        <CWToggle
          checked={isEnabled}
          onChange={() => setIsEnabled(!isEnabled)}
        />
      </div>

      <CWText type="b1">
        Enable your community members to access relevant communities linked to
        your chain on this optional page. Simply toggle on to generate the page
        and make it accessible within the sidebar, or toggle off to hide.
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

          <CWTooltip
            placement="top"
            content={
              community.directoryPageEnabled
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
                  disabled={!community.directoryPageEnabled}
                  buttonType="tertiary"
                  buttonHeight="sm"
                  label="Go to directory"
                  iconRight="arrowRightPhosphor"
                  onClick={() => navigate('/directory')}
                />
              </div>
            )}
          ></CWTooltip>
        </section>
      )}
      <CWButton
        containerClassName="action-btn"
        buttonType="secondary"
        label="Save Changes"
        disabled={
          isEnabled === community.directoryPageEnabled &&
          chainNodeId === community.directoryPageChainNodeId
        }
        onClick={onSaveChanges}
      />
    </section>
  );
};

export default Directory;
