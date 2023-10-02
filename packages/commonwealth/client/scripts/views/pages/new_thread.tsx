import { notifyError, notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import {
  CWContentPage,
  CWContentPageCard,
} from '../components/component_kit/CWContentPage';
import { parseCustomStages } from 'helpers';
import { detectURL } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { ThreadKind, ThreadStage } from 'models/types';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useJoinCommunity from '../components/Header/useJoinCommunity';
import {
  useNewThreadForm,
  checkNewThreadErrors,
} from '../components/NewThreadForm/helpers';
import {
  getTextFromDelta,
  createDeltaFromText,
  ReactQuillEditor,
} from '../components/react_quill_editor';
import { serializeDelta } from '../components/react_quill_editor/utils';
import Permissions from '../../utils/Permissions';
import { CWTab, CWTabBar } from '../components/component_kit/cw_tabs';
import { capitalize } from 'lodash';
import JoinCommunityBanner from '../components/JoinCommunityBanner';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { TopicSelector } from '../components/topic_selector';
import 'components/NewThreadForm.scss';
import { CWButton as OldCWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { Modal } from '../components/component_kit/cw_modal';
import { LinkSnapshotInitialThreadModal } from '../modals/update_proposal_status_modal';
import { Link, LinkDisplay, LinkSource } from 'models/Thread';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import { Link as ReactRouterLink } from 'react-router-dom';
import { NewSnapshotProposalModal } from '../modals/new_snapshot_proposal_modal';
import { renderQuillDeltaToText } from 'utils';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { TemplateSelector } from '../components/TemplateActionSelector';
import 'modals/template_action_modal.scss';
import 'components/TemplateSelectorItem.scss';
import 'pages/view_thread/linked_proposals_card.scss';

import ContractsPage from './contracts';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [linkSnapshotModalOpen, setLinkSnapshotModalOpen] = useState(false);
  const [createSnapshotModalOpen, setCreateSnapshotModalOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [linkedSnapshotProposal, setLinkedSnapshotProposal] =
    useState<Link>(null);
  const [linkedTemplateModalOpen, setLinkedTemplateModalOpen] = useState(false);
  const [linkedTemplate, setLinkedTemplate] = useState<Link>(null);
  const [contracts, setContracts] = useState<Array<any>>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [tempTemplates, setTempTemplates] = useState<any[]>([]);

  const fetchContracts = async () => {
    const contractsInStore = app.contracts.getCommunityContracts();
    setContracts(contractsInStore);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const getContractAndCct = (identifier) => {
    const contract = contracts.find((c) => {
      return c.ccts.some((cct) => cct.templateId === identifier);
    });

    const cct = contract?.ccts.find((_cct) => _cct.templateId === identifier);

    const newIdentifier = `${identifier}/${
      contract.address
    }/${cct?.cctmd.slug.replace('/', '')}`;

    return { contract, cct, newIdentifier };
  };

  useEffect(() => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to sign in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate]);

  const { data: topics, status } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const chainId = app.chain.id;
  const hasTopics = topics?.length;
  const isAdmin = Permissions.isCommunityAdmin();

  const topicsForSelector =
    topics?.filter((t) => {
      return (
        isAdmin || t.tokenThreshold.isZero() || !app.chain.isGatedTopic(t.id)
      );
    }) ?? [];

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    setThreadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    isDisabled,
    clearDraft,
  } = useNewThreadForm(chainId, topicsForSelector);

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { mutateAsync: createThread } = useCreateThreadMutation({
    chainId: app.activeChainId(),
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta)?.length > 0;
  }, [threadContentDelta, threadTitle]);

  const handleNewThreadCreation = async () => {
    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    const deltaString = JSON.stringify(threadContentDelta);

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      deltaString,
      !!hasTopics
    );

    setIsSaving(true);

    await app.sessions.signThread(app.user.activeAccount.address, {
      community: app.activeChainId(),
      title: threadTitle,
      body: deltaString,
      link: threadUrl,
      topic: threadTopic,
    });

    try {
      const thread = await createThread({
        address: app.user.activeAccount.address,
        kind: threadKind,
        stage: app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        chainId: app.activeChainId(),
        title: threadTitle,
        topic: threadTopic,
        body: serializeDelta(threadContentDelta),
        url: threadUrl,
        authorProfile: app.user.activeAccount.profile,
        links: links.length > 0 ? links : undefined,
      });

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${thread.id}`);
    } catch (err) {
      const error =
        err?.responseJSON?.error || err?.message || 'Failed to create thread';
      throw new Error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      topicsForSelector.find((t) => t.name.includes('General')) || null
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  const showBanner = !hasJoinedCommunity && isBannerVisible;

  const communityHasSnapshot =
    app.chain.meta?.snapshot && app.chain.meta?.snapshot?.length > 0;

  if (!app.chain) return <PageLoading />;

  const sidebarComponents = [
    {
      label: 'Add Action',
      item: (
        <CWContentPageCard
          header="Add Actions"
          content={
            <div className="ActionCard">
              <CWText type="b2">
                Add Actions such as proposals on-chain actions, polls, and or
                links to existing discussions and more
              </CWText>
              <OldCWButton
                buttonType="mini-black"
                label="Add Action"
                onClick={(e) => {
                  setShowSidebar(!showSidebar);
                }}
              />
            </div>
          }
        />
      ),
    },
    ...(linkedSnapshotProposal && communityHasSnapshot
      ? [
          {
            label: 'Linked Snapshot',
            item: (
              <CWContentPageCard
                header="Linked Snapshot"
                content={
                  <div className="ActionCard">
                    <ReactRouterLink
                      to={`https://snapshot.org/#/${
                        linkedSnapshotProposal.identifier.split('/')[0]
                      }/proposal/${
                        linkedSnapshotProposal.identifier.split('/')[1]
                      }`}
                      target="_blank"
                    >
                      Snapshot: {linkedSnapshotProposal.title}
                    </ReactRouterLink>
                  </div>
                }
              />
            ),
          },
        ]
      : []),
    ...(linkedTemplate
      ? [
          {
            label: 'Linked Template',
            item: (
              <CWContentPageCard
                header="Linked Template"
                content={
                  <div className="ActionCard">
                    <ReactRouterLink to={''} target="_blank">
                      Template: {linkedTemplate.title}
                    </ReactRouterLink>
                  </div>
                }
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <CWContentPage
      showHeader={false}
      body={() => (
        <>
          <div className="NewThreadForm">
            <div className="new-thread-header">
              <CWTabBar>
                <CWTab
                  label={capitalize(ThreadKind.Discussion)}
                  isSelected={threadKind === ThreadKind.Discussion}
                  onClick={() => setThreadKind(ThreadKind.Discussion)}
                />
                <CWTab
                  label={capitalize(ThreadKind.Link)}
                  isSelected={threadKind === ThreadKind.Link}
                  onClick={() => setThreadKind(ThreadKind.Link)}
                />
              </CWTabBar>
            </div>
            <div className="new-thread-body">
              <div className="new-thread-form-inputs">
                <div className="topics-and-title-row">
                  {hasTopics && (
                    <TopicSelector
                      topics={topicsForSelector}
                      value={threadTopic}
                      onChange={setThreadTopic}
                    />
                  )}
                  <CWTextInput
                    autoFocus
                    placeholder="Title"
                    value={threadTitle}
                    tabIndex={1}
                    onInput={(e) => setThreadTitle(e.target.value)}
                  />
                </div>

                {!isDiscussion && (
                  <CWTextInput
                    placeholder="https://"
                    value={threadUrl}
                    tabIndex={2}
                    onInput={(e) => setThreadUrl(e.target.value)}
                  />
                )}

                <ReactQuillEditor
                  contentDelta={threadContentDelta}
                  setContentDelta={setThreadContentDelta}
                  isDisabled={!hasJoinedCommunity}
                  tooltipLabel="Join community to submit"
                />

                <div className="buttons-row">
                  {isPopulated && hasJoinedCommunity && (
                    <CWButton
                      buttonType="tertiary"
                      onClick={handleCancel}
                      tabIndex={3}
                      label="Cancel"
                    />
                  )}
                  <CWButton
                    label="Submit"
                    disabled={isDisabled || !hasJoinedCommunity}
                    onClick={handleNewThreadCreation}
                    tabIndex={4}
                    buttonWidth="wide"
                  />
                </div>

                {showBanner && (
                  <JoinCommunityBanner
                    onClose={handleCloseBanner}
                    onJoin={handleJoinCommunity}
                  />
                )}
              </div>
            </div>
          </div>
          {JoinCommunityModals}
        </>
      )}
      sidebarComponents={sidebarComponents}
      rightSidebarContent={[
        ...(communityHasSnapshot
          ? [
              {
                label: 'Create Snapshot',
                item: (
                  <div className="SelectableCard">
                    <Modal
                      className="LinkedProposalsCardModal"
                      content={
                        <NewSnapshotProposalModal
                          onSave={(snapshotInfo: {
                            id: string;
                            snapshot_title: string;
                          }) => {
                            const newLink: Link = {
                              source: LinkSource.Snapshot,
                              identifier: snapshotInfo.id,
                              title: snapshotInfo.snapshot_title,
                            };

                            setLinkedSnapshotProposal(newLink);
                            setLinks((prev) => [...prev, newLink]);
                          }}
                          onModalClose={() => {
                            setCreateSnapshotModalOpen(false);
                          }}
                          thread={{
                            id: null,
                            title: threadTitle,
                            body: null,
                            plaintext: threadContentDelta
                              ? renderQuillDeltaToText(threadContentDelta)
                              : '',
                          }}
                          fromExistingThread={false}
                        />
                      }
                      onClose={() => setCreateSnapshotModalOpen(false)}
                      open={createSnapshotModalOpen}
                    />
                    <CWContentPageCard
                      header="Create Snapshot"
                      onClick={() => {
                        if (app.chain.meta.snapshot?.length > 0) {
                          setCreateSnapshotModalOpen(true);
                        } else {
                          notifyError(
                            "This community doesn't have snapshot spaces connected"
                          );
                        }
                      }}
                      content={
                        <div className="ActionCard">
                          <CWText type="b2">
                            Creates snapshot from existing text.
                          </CWText>
                        </div>
                      }
                    />
                  </div>
                ),
              },
              {
                label: 'Link Snapshot',
                item: (
                  <div className="SelectableCard">
                    <Modal
                      className="LinkedProposalsCardModal"
                      content={
                        <LinkSnapshotInitialThreadModal
                          onModalClose={() => {
                            setLinkSnapshotModalOpen(false);
                          }}
                          onSave={async (snapshot) => {
                            let enrichedSnapshot;
                            if (app.chain.meta.snapshot?.length === 1) {
                              enrichedSnapshot = {
                                id: `${app.chain.meta.snapshot[0]}/${snapshot.id}`,
                                title: snapshot.title,
                              };
                            } else {
                              await loadMultipleSpacesData(
                                app.chain.meta.snapshot
                              ).then((data) => {
                                for (const {
                                  space: _space,
                                  proposals,
                                } of data) {
                                  const matchingSnapshot = proposals.find(
                                    (sn) => sn.id === snapshot.id
                                  );
                                  if (matchingSnapshot) {
                                    enrichedSnapshot = {
                                      id: `${_space.id}/${snapshot.id}`,
                                      title: snapshot.title,
                                    };
                                    break;
                                  }
                                }
                              });
                            }

                            setLinkedSnapshotProposal({
                              source: LinkSource.Snapshot,
                              identifier: String(enrichedSnapshot.id),
                              title: enrichedSnapshot.title,
                            });
                            setLinks((prev) => [
                              ...prev,
                              {
                                source: LinkSource.Snapshot,
                                identifier: String(enrichedSnapshot.id),
                                title: enrichedSnapshot.title,
                              },
                            ]);
                            setLinkSnapshotModalOpen(false);
                          }}
                        />
                      }
                      onClose={() => setLinkSnapshotModalOpen(false)}
                      open={linkSnapshotModalOpen}
                    />
                    <CWContentPageCard
                      header="Link Snapshot"
                      onClick={() => {
                        if (app.chain.meta.snapshot?.length > 0) {
                          setLinkSnapshotModalOpen(true);
                        } else {
                          notifyError(
                            "This community doesn't have snapshot spaces connected"
                          );
                        }
                      }}
                      content={
                        <div className="ActionCard">
                          <CWText type="b2">
                            Search through snapshots show the poll directly on
                            the thread page
                          </CWText>
                        </div>
                      }
                    />
                  </div>
                ),
              },
            ]
          : []),

        {
          label: 'Create new template',
          item: (
            <div className="SelectableCard">
              <Modal
                content={<ContractsPage />}
                open={createTemplateModalOpen}
                onClose={() => {
                  setCreateTemplateModalOpen(false);
                }}
                className="ContractsPageModal"
              />
              <CWContentPageCard
                header="Create new template"
                onClick={() => {
                  setCreateTemplateModalOpen(true);
                }}
                content={
                  <div className="ActionCard">
                    <CWText type="b2">
                      Create a new contract action template.
                    </CWText>
                  </div>
                }
              />
            </div>
          ),
        },
        {
          label: 'Add existing template',
          item: (
            <div className="SelectableCard">
              <Modal
                className="LinkedProposalsCardModal"
                content={
                  <div className="TemplateActionModal">
                    <div className="compact-modal-title">
                      <h3>Add Templates</h3>
                      <CWIconButton
                        iconName="close"
                        onClick={() => setLinkedTemplateModalOpen(false)}
                      />
                    </div>
                    <div className="compact-modal-body">
                      <TemplateSelector
                        onSelect={(template: any) => {
                          console.log({ template });
                          const { newIdentifier } = getContractAndCct(
                            template.id
                          );

                          const templateLink: Link = {
                            source: LinkSource.Template,
                            identifier: newIdentifier,
                            title: template.name,
                            display: LinkDisplay.sidebar,
                          };

                          setLinkedTemplate(templateLink);
                          setTempTemplates([
                            {
                              title: template.name,
                              identifier: String(template.id),
                            },
                          ]);
                        }}
                        tempTemplates={tempTemplates}
                        contracts={contracts}
                        thread={null}
                        isOpen={true}
                      />
                      <div className="buttons-row">
                        <CWButton
                          label="Cancel"
                          onClick={() => setLinkedTemplateModalOpen(false)}
                        />
                        <CWButton
                          label="Save changes"
                          onClick={() => {
                            setLinks((prev) => [...prev, linkedTemplate]);
                            setLinkedTemplateModalOpen(false);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                }
                onClose={() => setLinkedTemplateModalOpen(false)}
                open={linkedTemplateModalOpen}
              />
              <CWContentPageCard
                header="Add existing template"
                onClick={() => {
                  setLinkedTemplateModalOpen(true);
                }}
                content={
                  <div className="ActionCard">
                    <CWText type="b2">
                      Add an existing template to the thread.
                    </CWText>
                  </div>
                }
              />
            </div>
          ),
        },
      ]}
      showSidebar
      showRightSidebar={showSidebar}
      lowPadding
      onCloseRightSidebar={() => {
        setShowSidebar(false);
      }}
    ></CWContentPage>
  );
};

export default NewThreadPage;
