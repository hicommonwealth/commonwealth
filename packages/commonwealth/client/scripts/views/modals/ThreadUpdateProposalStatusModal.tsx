import { buildUpdateThreadInput } from 'client/scripts/state/api/threads/editThread';
import { notifyError } from 'controllers/app/notifications';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import {
  SnapshotProposal,
  loadMultipleSpacesData,
} from 'helpers/snapshot_utils';
import { filterLinks, getAddedAndDeleted } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { Link, LinkSource } from 'models/Thread';
import React, { useState } from 'react';
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
import useAppStatus from '../../hooks/useAppStatus';
import type Thread from '../../models/Thread';
import { ProposalStatusModalContent } from './ProposalStatusModalContent';

type ThreadUpdateProposalStatusModalProps = {
  onChangeHandler?: (stage: string, links?: Link[]) => void;
  onModalClose: () => void;
  thread: Thread;
  snapshotProposalConnected?: boolean;
  initialSnapshotLinks?: Link[];
};

const getInitialSnapshots = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Snapshot).map((l) => ({
    id: l.identifier || '',
    title: l.title || '',
  }));

const getInitialCosmosProposals = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Proposal).map((l) => ({
    identifier: l.identifier || '',
    title: l.title || '',
  }));

export const ThreadUpdateProposalStatusModal = ({
  onChangeHandler,
  onModalClose,
  thread,
  snapshotProposalConnected,
  initialSnapshotLinks = [],
}: ThreadUpdateProposalStatusModalProps) => {
  const user = useUserStore();
  const { isAddedToHomeScreen } = useAppStatus();

  const [tempStage, setTempStage] = useState<string | null>(thread.stage);
  const [tempSnapshotProposals, setTempSnapshotProposals] = useState<
    Array<Pick<SnapshotProposal, 'id' | 'title'>>
  >(getInitialSnapshots(thread));

  const [tempCosmosProposals, setTempCosmosProposals] = useState<
    Array<Pick<CosmosProposal, 'identifier' | 'title'>>
  >(getInitialCosmosProposals(thread));

  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
    threadMsgId: thread.canvasMsgId!,
    currentStage: thread.stage,
    currentTopicId: thread.topic!.id!,
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
    buildUpdateThreadInput({
      address: user.activeAccount?.address || '',
      communityId: app.activeChainId() || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      stage: tempStage!,
    })
      .then((input) => {
        editThread(input)
          .then(() => {
            let links = thread?.links;
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

  const handleRemoveProposal = () => {
    try {
      deleteThreadLinks({
        communityId: app.activeChainId() || '',
        threadId: thread.id,
        links: [
          {
            source: LinkSource.Snapshot,
            identifier: initialSnapshotLinks[0]?.identifier ?? '',
          },
        ],
      })
        .then(() => {
          setTempSnapshotProposals([]);
          onModalClose();
        })
        .catch((error) => {
          console.error(error);
          notifyError('Failed to remove linked proposal');
        });
    } catch (error) {
      console.error(error);
      notifyError('Failed to remove linked proposal');
    }
  };

  return (
    <ProposalStatusModalContent
      onModalClose={onModalClose}
      showRemoveButton={snapshotProposalConnected}
      onRemoveProposal={handleRemoveProposal}
      onSaveChanges={handleSaveChanges}
      tempStage={tempStage}
      setTempStage={setTempStage}
      tempSnapshotProposals={tempSnapshotProposals}
      setTempSnapshotProposals={setTempSnapshotProposals}
      tempCosmosProposals={tempCosmosProposals}
      setTempCosmosProposals={setTempCosmosProposals}
    />
  );
};
