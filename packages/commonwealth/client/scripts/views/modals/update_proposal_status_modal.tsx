import React, { useState } from 'react';

import {
  SnapshotProposal,
  loadMultipleSpacesData,
} from 'helpers/snapshot_utils';
import { parseCustomStages, threadStageToLabel } from '../../helpers';
import type Thread from '../../models/Thread';

import { ChainBase } from '@hicommonwealth/shared';
import { buildUpdateThreadInput } from 'client/scripts/state/api/threads/editThread';
import { notifyError } from 'controllers/app/notifications';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { filterLinks, getAddedAndDeleted } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { Link, LinkSource } from 'models/Thread';
import app from 'state';
import {
  useAddThreadLinksMutation,
  useDeleteThreadLinksMutation,
  useEditThreadMutation,
} from 'state/api/threads';
import useUserStore from 'state/ui/user';
import {
  MixpanelCommunityInteractionEvent,
  MixpanelCommunityInteractionEventPayload,
} from '../../../../shared/analytics/types';
import '../../../styles/pages/UpdateProposalStatusModal.scss';
import useAppStatus from '../../hooks/useAppStatus';
import { ThreadStage } from '../../models/types';
import { CosmosProposalSelector } from '../components/CosmosProposalSelector';
import { SelectList } from '../components/component_kit/cw_select_list';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';

const getInitialSnapshots = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Snapshot).map((l) => ({
    id: l.identifier,
    title: l.title,
  }));

const getInitialCosmosProposals = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Proposal).map((l) => ({
    identifier: l.identifier,
    title: l.title,
  }));

type UpdateProposalStatusModalProps = {
  onChangeHandler?: (stage: string, links?: Link[]) => void;
  onModalClose: () => void;
  thread: Thread;
  snapshotProposalConnected?: boolean;
  initialSnapshotLinks?: Link[];
};

export const UpdateProposalStatusModal = ({
  onChangeHandler,
  onModalClose,
  thread,
  snapshotProposalConnected,
  initialSnapshotLinks,
}: UpdateProposalStatusModalProps) => {
  const { custom_stages } = app.chain.meta;
  const stages = parseCustomStages(custom_stages);
  const user = useUserStore();

  const [tempStage, setTempStage] = useState(
    stages.includes(thread.stage) ? thread.stage : null,
  );
  const [tempSnapshotProposals, setTempSnapshotProposals] = useState<
    Array<Pick<SnapshotProposal, 'id' | 'title'>>
    // @ts-expect-error <StrictNullChecks/>
  >(getInitialSnapshots(thread));
  const [tempCosmosProposals, setTempCosmosProposals] = useState<
    Array<Pick<CosmosProposal, 'identifier' | 'title'>>
    // @ts-expect-error <StrictNullChecks/>
  >(getInitialCosmosProposals(thread));

  const { isAddedToHomeScreen } = useAppStatus();

  const showSnapshot = !!app.chain.meta?.snapshot_spaces?.length;
  const isCosmos = app.chain.base === ChainBase.CosmosSDK;

  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
    threadMsgId: thread.canvasMsgId,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id!,
  });

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
  });

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelCommunityInteractionEventPayload>({
      onAction: true,
    });

  const handleSaveChanges = () => {
    // set stage
    buildUpdateThreadInput({
      address: user.activeAccount?.address || '',
      communityId: app.activeChainId() || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId,
      stage: tempStage!,
    })
      .then((input) => {
        editThread(input)
          .then(() => {
            let links = thread.links;
            const { toAdd, toDelete } = getAddedAndDeleted(
              tempSnapshotProposals,
              getInitialSnapshots(thread),
            );

            if (toAdd.length > 0) {
              if (app.chain.meta?.snapshot_spaces?.length === 1) {
                const enrichedSnapshot = {
                  id: `${app.chain.meta?.snapshot_spaces?.[0]}/${toAdd[0].id}`,
                  title: toAdd[0].title,
                };
                return addThreadLinks({
                  communityId: app.activeChainId() || '',
                  threadId: thread.id,
                  links: [
                    {
                      source: LinkSource.Snapshot,
                      identifier: String(enrichedSnapshot.id),
                      title: enrichedSnapshot.title,
                    },
                  ],
                }).then((updatedThread) => {
                  links = updatedThread.links;
                  return { toDelete, links };
                });
              } else {
                return loadMultipleSpacesData(app.chain.meta?.snapshot_spaces)
                  .then((data) => {
                    let enrichedSnapshot;
                    for (const { space: _space, proposals } of data) {
                      const matchingSnapshot = proposals.find(
                        (sn) => sn.id === toAdd[0].id,
                      );
                      if (matchingSnapshot) {
                        enrichedSnapshot = {
                          id: `${_space.id}/${toAdd[0].id}`,
                          title: toAdd[0].title,
                        };
                        break;
                      }
                    }
                    return addThreadLinks({
                      communityId: app.activeChainId() || '',
                      threadId: thread.id,
                      links: [
                        {
                          source: LinkSource.Snapshot,
                          identifier: String(enrichedSnapshot.id),
                          title: enrichedSnapshot.title,
                        },
                      ],
                    });
                  })
                  .then((updatedThread) => {
                    links = updatedThread.links;
                    return { toDelete, links };
                  });
              }
            } else {
              return { toDelete, links };
            }
          })
          .then(({ toDelete, links }) => {
            if (toDelete.length > 0) {
              return deleteThreadLinks({
                communityId: app.activeChainId() || '',
                threadId: thread.id,
                links: toDelete.map((sn) => ({
                  source: LinkSource.Snapshot,
                  identifier: String(sn.id),
                })),
              }).then((updatedThread) => {
                // eslint-disable-next-line no-param-reassign
                links = updatedThread.links;
                return links;
              });
            } else {
              return links;
            }
          })
          .catch((err) => {
            const error =
              err.response.data.error ||
              'Failed to update stage. Make sure one is selected.';
            notifyError(error);
            throw new Error(error);
          })
          .then((links) => {
            const { toAdd, toDelete } = getAddedAndDeleted(
              tempCosmosProposals,
              getInitialCosmosProposals(thread),
              'identifier',
            );

            if (toAdd.length > 0) {
              return addThreadLinks({
                communityId: app.activeChainId() || '',
                threadId: thread.id,
                links: toAdd.map(({ identifier, title }) => ({
                  source: LinkSource.Proposal,
                  identifier: identifier,
                  title: title,
                })),
              }).then((updatedThread) => {
                // eslint-disable-next-line no-param-reassign
                links = updatedThread.links;
                return { toDelete, links };
              });
            } else {
              return { toDelete, links };
            }
          })
          .then(({ toDelete, links }) => {
            if (toDelete.length > 0) {
              return deleteThreadLinks({
                communityId: app.activeChainId() || '',
                threadId: thread.id,
                links: toDelete.map(({ identifier }) => ({
                  source: LinkSource.Proposal,
                  identifier: String(identifier),
                })),
              }).then((updatedThread) => {
                // eslint-disable-next-line no-param-reassign
                links = updatedThread.links;
                return links;
              });
            } else {
              return links;
            }
          })
          .catch((err) => {
            console.log(err);
            notifyError('Failed to update linked proposals');
          })
          .then((links) => {
            trackAnalytics({
              event:
                MixpanelCommunityInteractionEvent.LINK_PROPOSAL_BUTTON_PRESSED,
              isPWA: isAddedToHomeScreen,
            });

            // @ts-expect-error <StrictNullChecks/>
            onChangeHandler?.(tempStage, links);
            onModalClose();
          })
          .catch((err) => {
            console.log(err);
            notifyError('An unexpected error occurred');
          });
      })
      .catch((err) => {
        console.log(err);
        notifyError('An unexpected error occurred');
      });
  };

  const handleRemoveProposal = async () => {
    try {
      await deleteThreadLinks({
        communityId: app.activeChainId() || '',
        threadId: thread.id,
        links: [
          {
            source: LinkSource.Snapshot,
            identifier: initialSnapshotLinks?.[0]?.identifier ?? '',
          },
        ],
      });
      onModalClose();
    } catch (error) {
      console.log(error);
      notifyError('Failed to remove linked proposal');
    }
  };

  const handleRemoveProposalWrapper = () => {
    handleRemoveProposal().catch((error) => {
      console.error('Unhandled error:', error);
    });
  };

  const setVotingStage = () => {
    if (
      tempStage === ThreadStage.Discussion ||
      tempStage === ThreadStage.ProposalInReview
    ) {
      setTempStage(ThreadStage.Voting);
    }
  };

  const handleSelectProposal = (sn: SnapshotProposal) => {
    const isSelected = tempSnapshotProposals.find(({ id }) => sn.id === id);

    setTempSnapshotProposals(
      isSelected ? [] : [{ id: sn.id, title: sn.title }],
    );
    setVotingStage();
  };

  const handleSelectCosmosProposal = (proposal: {
    identifier: string;
    title: string;
  }) => {
    const isSelected = tempCosmosProposals.find(
      ({ identifier }) => proposal.identifier === String(identifier),
    );
    const updatedProposals = isSelected
      ? tempCosmosProposals.filter(
          ({ identifier }) => proposal.identifier !== String(identifier),
        )
      : [...tempCosmosProposals, proposal];
    setTempCosmosProposals(updatedProposals);
    setVotingStage();
  };

  return (
    <div className="UpdateProposalStatusModal">
      <CWModalHeader
        label="Update proposal status"
        onModalClose={onModalClose}
      />
      <CWModalBody allowOverflow>
        {showSnapshot ? (
          <>
            <SelectList
              defaultValue={
                tempStage
                  ? { value: tempStage, label: threadStageToLabel(tempStage) }
                  : null
              }
              placeholder="Select a stage"
              isSearchable={false}
              options={stages.map((stage) => ({
                value: stage as unknown as ThreadStage,
                label: threadStageToLabel(stage),
              }))}
              className="StageSelector"
              // @ts-expect-error <StrictNullChecks/>
              onChange={(option) => setTempStage(option.value)}
            />
            <SnapshotProposalSelector
              onSelect={handleSelectProposal}
              snapshotProposalsToSet={tempSnapshotProposals}
            />
          </>
        ) : (
          <CWText>Please connect your Snapshot space </CWText>
        )}
        {isCosmos && (
          <CosmosProposalSelector
            onSelect={handleSelectCosmosProposal}
            proposalsToSet={tempCosmosProposals}
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        <div className="proposal-modal">
          <div className="left-button">
            {snapshotProposalConnected && (
              <CWButton
                label="Remove proposal"
                buttonType="destructive"
                buttonHeight="sm"
                onClick={handleRemoveProposalWrapper}
              />
            )}
          </div>
          <div className="right-buttons">
            <CWButton
              label="Cancel"
              buttonType="secondary"
              buttonHeight="sm"
              onClick={onModalClose}
            />
            {showSnapshot && (
              <CWButton
                buttonType="primary"
                buttonHeight="sm"
                label="Save changes"
                onClick={handleSaveChanges}
              />
            )}
          </div>
        </div>
      </CWModalFooter>
    </div>
  );
};
