import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import useAppStatus from 'hooks/useAppStatus';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { useFetchNodesQuery } from 'state/api/nodes';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWTypeaheadSelectList } from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';
import './Directory.scss';

const Directory = () => {
  const { data: chainNodes } = useFetchNodesQuery();

  const chainNodeOptions = chainNodes?.map((chain) => ({
    value: String(chain.id),
    label: chain.name,
  }));
  const chainNodeOptionsSorted = (chainNodeOptions || []).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: true,
    });

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: community?.id || '',
  });
  const communityDefaultChainNodeId = community?.ChainNode?.id;

  const navigate = useCommonNavigate();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [chainNodeId, setChainNodeId] = useState<number | null>();
  const [isSaving, setIsSaving] = useState(false);

  useRunOnceOnCondition({
    callback: () => {
      setIsEnabled(!!community?.directory_page_enabled);
      setChainNodeId(community?.directory_page_chain_node_id);
    },
    shouldRun: !isLoadingCommunity && !!community,
  });

  const { isAddedToHomeScreen } = useAppStatus();

  const defaultChainNodeId = chainNodeId ?? communityDefaultChainNodeId;
  const defaultOption = chainNodeOptionsSorted?.find(
    (option) => option.value === String(defaultChainNodeId),
  );

  const onSaveChanges = useCallback(async () => {
    if (
      isSaving ||
      !community?.id ||
      (isEnabled === community?.directory_page_enabled &&
        chainNodeId === community?.directory_page_chain_node_id)
    )
      return;

    try {
      setIsSaving(true);

      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community?.id,
          directoryPageChainNodeId: chainNodeId || undefined,
          directoryPageEnabled: isEnabled,
          isPWA: isAddedToHomeScreen,
        }),
      );

      notifySuccess('Updated community directory');
    } catch {
      notifyError('Failed to update community directory!');
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    chainNodeId,
    community?.id,
    community?.directory_page_enabled,
    community?.directory_page_chain_node_id,
    isEnabled,
    isAddedToHomeScreen,
    updateCommunity,
  ]);

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
              // @ts-expect-error <StrictNullChecks/>
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
              community?.directory_page_enabled
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
                  disabled={
                    !community?.directory_page_enabled || isLoadingCommunity
                  }
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
          (isEnabled === community?.directory_page_enabled &&
            chainNodeId === community?.directory_page_chain_node_id) ||
          isLoadingCommunity
        }
        onClick={onSaveChanges}
      />
    </section>
  );
};

export default Directory;
