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
import { Link, LinkSource } from 'models/Thread';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [linkSnapshotModalOpen, setLinkSnapshotModalOpen] = useState(false);
  const [linkedSnapshotProposal, setLinkedSnapshotProposal] =
    useState<Link>(null);

  useEffect(() => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate]);

  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const chainId = app.chain.id;
  const hasTopics = topics?.length;
  const isAdmin = Permissions.isCommunityAdmin();

  const topicsForSelector = topics.filter((t) => {
    return (
      isAdmin || t.tokenThreshold.isZero() || !app.chain.isGatedTopic(t.id)
    );
  });

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
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
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

    await app.sessions.signThread({
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
        links: linkedSnapshotProposal ? [linkedSnapshotProposal] : undefined,
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

  if (!app.chain) return <PageLoading />;

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
      sidebarComponents={[
        {
          label: 'Add Action',
          item: (
            <CWContentPageCard
              header="Add Actions"
              content={
                <div className="ActionCard">
                  <CWText type="b2">
                    Add Actions such as proposals on-chain actions, polls, and
                    or links to existing discussions and more
                  </CWText>
                  <OldCWButton
                    buttonType="mini-black"
                    label="Add Action"
                    onClick={(e) => {
                      setShowSidebar(true);
                    }}
                  />
                </div>
              }
            />
          ),
        },
      ]}
      rightSidebarContent={[
        {
          label: 'Create Snapshot',
          item: (
            <div className="SelectableCard">
              <CWContentPageCard
                header="Create Snapshot"
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
                          for (const { space: _space, proposals } of data) {
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
                      setLinkSnapshotModalOpen(false);
                    }}
                  />
                }
                onClose={() => setLinkSnapshotModalOpen(false)}
                open={linkSnapshotModalOpen}
              />
              <CWContentPageCard
                header="Link Snapshot"
                content={
                  <div
                    className="ActionCard"
                    onClick={() => setLinkSnapshotModalOpen(true)}
                  >
                    <CWText type="b2">
                      Search through snapshots show the poll directly on the
                      thread page
                    </CWText>
                  </div>
                }
              />
            </div>
          ),
        },
        {
          label: 'Create new template',
          item: (
            <div className="SelectableCard">
              <CWContentPageCard
                header="Create new template"
                content={
                  <div className="ActionCard">
                    <CWText type="b2">
                      Search through snapshots show the poll directly on the
                      thread page
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
              <CWContentPageCard
                header="Add existing template"
                content={
                  <div className="ActionCard">
                    <CWText type="b2">
                      Search through snapshots show the poll directly on the
                      thread page
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
