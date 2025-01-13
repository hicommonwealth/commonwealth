import { PermissionEnum } from '@hicommonwealth/schemas';
import {
  ContentType,
  MIN_CHARS_TO_SHOW_MORE,
  getThreadUrl,
} from '@hicommonwealth/shared';
import { Thread, ThreadView } from 'client/scripts/models/Thread';
import { notifyError } from 'controllers/app/notifications';
import { extractDomain, isDefaultStage } from 'helpers';
import { filterLinks, getThreadActionTooltipText } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import useTopicGating from 'hooks/useTopicGating';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import app from 'state';
import useGetContentByUrlQuery from 'state/api/general/getContentByUrl';
import { useFetchGroupsQuery } from 'state/api/groups';
import {
  useAddThreadLinksMutation,
  useGetThreadPollsQuery,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import useUserStore from 'state/ui/user';
import ExternalLink from 'views/components/ExternalLink';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import MarkdownViewerUsingQuillOrNewEditor from 'views/components/MarkdownViewerWithFallback';
import { checkIsTopicInContest } from 'views/components/NewThreadFormLegacy/helpers';
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import Poll from '../../../models/Poll';
import { Link, LinkSource } from '../../../models/Thread';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
import MetaTags from '../../components/MetaTags';
import type { SidebarComponents } from '../../components/component_kit/CWContentPage';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { CWGatedTopicBanner } from '../../components/component_kit/CWGatedTopicBanner';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { getTextFromDelta } from '../../components/react_quill_editor/';
import { CommentTree } from '../discussions/CommentTree';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { LinkedUrlCard } from './LinkedUrlCard';
import { ThreadPollCard } from './ThreadPollCard';
import { ThreadPollEditorCard } from './ThreadPollEditorCard';
import { EditBody } from './edit_body';
import './index.scss';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { LockMessage } from './lock_message';
import { SnapshotCreationCard } from './snapshot_creation_card';

type ViewThreadPageProps = {
  identifier: string;
};
const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const threadId = identifier.split('-')[0];
  const stickyEditor = useFlag('stickyEditor');
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('isEdit') ?? undefined;
  const navigate = useCommonNavigate();
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);

  const [hideGatingBanner, setHideGatingBanner] = useState(false);

  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();

  const user = useUserStore();
  const commentsRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const { isAddedToHomeScreen } = useAppStatus();

  const communityId = app.activeChainId() || '';
  const { data: groups = [] } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled: !!communityId,
  });

  const {
    data,
    error: fetchThreadError,
    isLoading,
  } = useGetThreadsByIdQuery({
    community_id: communityId,
    thread_ids: [+threadId].filter(Boolean),
    apiCallEnabled: !!threadId && !!communityId, // only call the api if we have thread id
  });

  const { data: pollsData = [] } = useGetThreadPollsQuery({
    threadId: +threadId,
    communityId,
    apiCallEnabled: !!threadId && !!communityId,
  });

  const thread = useMemo(() => {
    const t = data?.at(0);
    return t ? new Thread(t as ThreadView) : undefined;
  }, [data]);

  const [contentUrlBodyToFetch, setContentUrlBodyToFetch] = useState<
    string | null
  >(null);

  useRunOnceOnCondition({
    callback: () => {
      thread?.contentUrl && setContentUrlBodyToFetch(thread?.contentUrl);
    },
    shouldRun: !!thread?.contentUrl,
  });

  const { data: contentUrlBody, isLoading: isLoadingContentBody } =
    useGetContentByUrlQuery({
      contentUrl: contentUrlBodyToFetch || '',
      enabled: !!contentUrlBodyToFetch,
    });

  const [activeThreadVersionId, setActiveThreadVersionId] = useState<number>();
  const [threadBody, setThreadBody] = useState(thread?.body);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { contestsData } = useCommunityContests();
  const isTopicInContest = checkIsTopicInContest(
    contestsData.all,
    thread?.topic?.id,
  );

  useEffect(() => {
    if (
      isEdit === 'true' &&
      thread &&
      (isAdmin || Permissions.isThreadAuthor(thread))
    ) {
      setShouldRestoreEdits(true);
      setIsGloballyEditing(true);
      setIsEditingBody(true);
    }
    if (thread && thread?.title) {
      setDraftTitle(thread.title);
    }
  }, [isEdit, thread, isAdmin]);

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    communityId,
    threadId: parseInt(threadId),
  });

  const { isRestrictedMembership, foundTopicPermissions } = useTopicGating({
    communityId,
    apiEnabled: !!user?.activeAccount?.address && !!communityId,
    userAddress: user?.activeAccount?.address || '',
    topicId: thread?.topic?.id || 0,
  });

  const { isWindowLarge } = useBrowserWindow({
    onResize: () =>
      breakpointFnValidator(
        isCollapsedSize,
        (state: boolean) => {
          setIsCollapsedSize(state);
        },
        isWindowMediumSmallInclusive,
      ),
    resizeListenerUpdateDeps: [isCollapsedSize],
  });

  useEffect(() => {
    breakpointFnValidator(
      isCollapsedSize,
      (state: boolean) => {
        setIsCollapsedSize(state);
      },
      isWindowMediumSmallInclusive,
    );
    // Note: Disabling lint rule since we only want to run it once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // find if the current topic is gated
  const foundGatedTopic = groups.find((x) => {
    if (thread?.topic) {
      return (
        Array.isArray(x.topics) &&
        x?.topics?.find((y) => y.id === thread.topic!.id)
      );
    }
  });

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.THREAD_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  useManageDocumentTitle('View thread', thread?.title);

  // Imp: this correctly sets the thread body
  // 1. if content_url is provided it will fetch body from there
  // 2. else it will use available body
  // 3. it won't interfere with version history selection, unless thread body or content_url changes
  useEffect(() => {
    if (thread?.contentUrl) {
      setContentUrlBodyToFetch(thread.contentUrl);
    } else {
      setThreadBody(thread?.body || '');
      setContentUrlBodyToFetch('');
    }
  }, [thread?.body, thread?.contentUrl]);

  // Imp: this is expected to override version history selection
  useEffect(() => {
    if (contentUrlBody) {
      setThreadBody(contentUrlBody);
    }
  }, [contentUrlBody]);

  // Imp: this is expected to "not-interfere" with version history selector
  useEffect(() => {
    if (thread?.versionHistory) {
      setActiveThreadVersionId(
        Math.max(...thread.versionHistory.map(({ id }) => id)),
      );
    }
  }, [thread?.versionHistory]);

  if (typeof identifier !== 'string') {
    return <PageNotFound />;
  }

  if (
    !app.chain?.meta ||
    isLoading ||
    (isLoadingContentBody && contentUrlBodyToFetch)
  ) {
    return (
      <CWPageLayout>
        <CWContentPage
          showSkeleton
          sidebarComponentsSkeletonCount={isWindowLarge ? 2 : 0}
        />
      </CWPageLayout>
    );
  }

  if (
    (!isLoading && !thread) ||
    fetchThreadError ||
    thread?.communityId !== app.activeChainId()
  ) {
    return <PageNotFound message="Thread not found" />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const isAuthor = thread && Permissions.isThreadAuthor(thread);
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const linkedSnapshots = filterLinks(thread?.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread?.links, LinkSource.Proposal);
  const linkedThreads = filterLinks(thread?.links, LinkSource.Thread);

  const showLinkedProposalOptions =
    linkedSnapshots.length > 0 ||
    linkedProposals.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  // Todo who should actually be able to view this
  const canCreateSnapshotProposal =
    app.chain?.meta?.snapshot_spaces?.length > 0 && (isAuthor || isAdminOrMod);

  const showLinkedThreadOptions =
    linkedThreads.length > 0 || isAuthor || isAdminOrMod;

  const hasSnapshotProposal = thread?.links.find(
    (x) => x.source === 'snapshot',
  );

  const hasWebLinks = thread?.links.find((x) => x.source === 'web');

  const handleNewSnapshotChange = async ({
    id,
    snapshot_title,
  }: {
    id: string;
    snapshot_title: string;
  }) => {
    const newLink: Link = {
      source: LinkSource.Snapshot,
      identifier: id,
      title: snapshot_title,
    };
    const toAdd = [newLink]; // Add this line to create an array with the new link

    if (thread && toAdd.length > 0) {
      try {
        await addThreadLinks({
          communityId,
          threadId: thread.id,
          links: toAdd,
        });
      } catch {
        notifyError('Failed to update linked threads');
        return;
      }
    }
  };

  const editsToSave = localStorage.getItem(
    `${app.activeChainId()}-edit-thread-${thread?.id}-storedText`,
  );
  const isStageDefault = thread && isDefaultStage(app, thread.stage);

  const tabsShouldBePresent =
    showLinkedProposalOptions ||
    showLinkedThreadOptions ||
    pollsData?.length > 0;

  const showBanner = !user.activeAccount && isBannerVisible;
  const fromDiscordBot =
    thread?.discord_meta !== null && thread?.discord_meta !== undefined;

  const showLocked =
    (thread?.readOnly && !thread?.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread =
    thread &&
    user.isLoggedIn &&
    (Permissions.isSiteAdmin() ||
      Permissions.isCommunityAdmin() ||
      Permissions.isCommunityModerator() ||
      Permissions.isThreadAuthor(thread) ||
      Permissions.isThreadCollaborator(thread) ||
      (fromDiscordBot && isAdmin));

  const gatedGroupsMatchingTopic = groups?.filter((x) =>
    x?.topics?.find((y) => y?.id === thread?.topic?.id),
  );

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!user.activeAccount,
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_COMMENT,
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  const canComment =
    !!user.activeAccount &&
    !isRestrictedMembership &&
    !disabledActionsTooltipText;

  const handleVersionHistoryChange = (versionId: number) => {
    const foundVersion = (thread?.versionHistory || []).find(
      (version) => version.id === versionId,
    );
    foundVersion && setActiveThreadVersionId(foundVersion?.id);
    if (!foundVersion?.content_url) {
      setThreadBody(foundVersion?.body || '');
      setContentUrlBodyToFetch('');
      return;
    }
    if (contentUrlBodyToFetch === foundVersion.content_url && contentUrlBody) {
      setThreadBody(contentUrlBody);
      setContentUrlBodyToFetch('');
      return;
    }
    setContentUrlBodyToFetch(foundVersion.content_url);
  };

  const getMetaDescription = (meta: string) => {
    try {
      const parsedMeta = JSON.parse(meta);
      if (getTextFromDelta(parsedMeta)) {
        return getTextFromDelta(parsedMeta) || meta;
      } else {
        return meta;
      }
    } catch (error) {
      return;
    }
  };

  const ogTitle =
    (thread?.title?.length ?? 0 > 60)
      ? `${thread?.title?.slice?.(0, 52)}...`
      : thread?.title;
  const ogDescription =
    // @ts-expect-error <StrictNullChecks/>
    getMetaDescription(threadBody || '')?.length > 155
      ? `${getMetaDescription(threadBody || '')?.slice?.(0, 152)}...`
      : getMetaDescription(threadBody || '');
  const ogImageUrl = app?.chain?.meta?.icon_url || '';

  const scrollToFirstComment = () => {
    if (commentsRef?.current) {
      const ref = document.getElementsByClassName('Body')[0];
      ref.scrollTo({
        top: commentsRef?.current.offsetTop - 105,
        behavior: 'smooth',
      });
    }
  };
  return (
    <StickCommentProvider>
      <MetaTags
        customMeta={[
          {
            name: 'title',
            content: ogTitle!,
          },
          {
            name: 'description',
            content: ogDescription!,
          },
          {
            name: 'author',
            content: thread?.author ?? '',
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            content: ogTitle!,
          },
          {
            name: 'twitter:description',
            content: ogDescription!,
          },
          {
            name: 'twitter:image',
            content: ogImageUrl,
          },
          {
            name: 'twitter:url',
            content: window.location.href,
          },
          {
            name: 'og:title',
            content: ogTitle!,
          },
          {
            name: 'og:description',
            content: ogDescription!,
          },
          {
            name: 'og:image',
            content: ogImageUrl,
          },
          {
            name: 'og:type',
            content: 'article',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
        ]}
      />

      <Helmet>
        <link
          rel="canonical"
          href={getThreadUrl({
            chain: thread?.communityId || '',
            id: threadId,
            title: thread?.title,
          })}
        />
      </Helmet>

      <CWPageLayout ref={pageRef}>
        <CWContentPage
          showTabs={isCollapsedSize && tabsShouldBePresent}
          contentBodyLabel="Thread"
          showSidebar={
            showLinkedProposalOptions ||
            showLinkedThreadOptions ||
            pollsData?.length > 0 ||
            isAuthor ||
            !!hasWebLinks
          }
          onCommentClick={scrollToFirstComment}
          isSpamThread={!!thread?.markedAsSpamAt}
          title={
            isEditingBody ? (
              <CWTextInput
                onInput={(e) => {
                  setDraftTitle(e.target.value);
                }}
                value={draftTitle}
              />
            ) : (
              thread?.title
            )
          }
          isEditing={isEditingBody}
          // @ts-expect-error <StrictNullChecks/>
          author={
            thread?.author ? app.chain.accounts.get(thread?.author) : null
          }
          discord_meta={thread!.discord_meta!}
          collaborators={thread?.collaborators}
          createdAt={thread?.createdAt}
          updatedAt={thread?.updatedAt}
          lastEdited={thread?.lastEdited}
          viewCount={thread?.viewCount}
          canUpdateThread={canUpdateThread}
          stageLabel={!isStageDefault ? thread?.stage : undefined}
          subHeader={
            !!thread?.url && (
              <ExternalLink url={thread.url}>
                {extractDomain(thread.url)}
              </ExternalLink>
            )
          }
          thread={thread}
          onLockToggle={() => {
            setIsGloballyEditing(false);
            setIsEditingBody(false);
          }}
          onDelete={() => navigate('/discussions')}
          onEditCancel={() => {
            setIsGloballyEditing(true);
            setIsEditingBody(true);
          }}
          onEditConfirm={() => {
            setShouldRestoreEdits(true);
            setIsGloballyEditing(true);
            setIsEditingBody(true);
          }}
          onEditStart={() => {
            if (thread && editsToSave) {
              clearEditingLocalStorage(thread.id, ContentType.Thread);

              setSavedEdits(editsToSave || '');
            }

            setIsGloballyEditing(true);
            setIsEditingBody(true);
          }}
          onSpamToggle={() => {
            setIsGloballyEditing(false);
            setIsEditingBody(false);
          }}
          hasPendingEdits={!!editsToSave}
          activeThreadVersionId={activeThreadVersionId}
          onChangeVersionHistoryNumber={handleVersionHistoryChange}
          body={(threadOptionsComp) => (
            <div className="thread-content">
              {thread && isEditingBody && threadBody ? (
                <>
                  {/*// TODO editing thread */}
                  <EditBody
                    title={draftTitle}
                    thread={thread}
                    activeThreadBody={threadBody}
                    savedEdits={savedEdits}
                    shouldRestoreEdits={shouldRestoreEdits}
                    cancelEditing={() => {
                      setIsGloballyEditing(false);
                      setIsEditingBody(false);
                      if (!draftTitle.length) {
                        setDraftTitle(thread?.title);
                      }
                    }}
                    threadUpdatedCallback={() => {
                      setIsGloballyEditing(false);
                      setIsEditingBody(false);
                    }}
                    isDisabled={draftTitle && draftTitle.length ? false : true}
                  />
                  {threadOptionsComp}
                </>
              ) : (
                <>
                  <MarkdownViewerUsingQuillOrNewEditor
                    key={threadBody}
                    markdown={threadBody || ''}
                    cutoffLines={50}
                    maxChars={MIN_CHARS_TO_SHOW_MORE}
                  />

                  {thread?.readOnly || fromDiscordBot ? (
                    <>
                      {threadOptionsComp}
                      {!thread.readOnly && thread.markedAsSpamAt && (
                        <div className="callout-text">
                          <CWIcon
                            iconName="flag"
                            weight="fill"
                            iconSize="small"
                          />
                          <CWText type="h5">
                            This thread was flagged as spam on{' '}
                            {moment(thread.createdAt).format('DD/MM/YYYY')},
                            meaning it can no longer be edited or commented on.
                          </CWText>
                        </div>
                      )}
                      {showLocked && (
                        <LockMessage
                          lockedAt={thread.lockedAt}
                          updatedAt={thread.updatedAt}
                          fromDiscordBot={fromDiscordBot}
                        />
                      )}
                    </>
                  ) : thread && !isGloballyEditing && user.isLoggedIn ? (
                    <>
                      {threadOptionsComp}

                      {!stickyEditor && (
                        <CreateComment
                          rootThread={thread}
                          canComment={canComment}
                          tooltipText={
                            typeof disabledActionsTooltipText === 'function'
                              ? disabledActionsTooltipText?.('comment')
                              : disabledActionsTooltipText
                          }
                        />
                      )}
                      {foundGatedTopic &&
                        !hideGatingBanner &&
                        isRestrictedMembership && (
                          <CWGatedTopicBanner
                            groupNames={gatedGroupsMatchingTopic.map(
                              (g) => g.name,
                            )}
                            onClose={() => setHideGatingBanner(true)}
                          />
                        )}
                      {showBanner && (
                        <JoinCommunityBanner
                          onClose={handleCloseBanner}
                          onJoin={handleJoinCommunity}
                        />
                      )}
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}
          comments={
            <>
              <CommentTree
                pageRef={pageRef}
                commentsRef={commentsRef}
                thread={thread!}
                setIsGloballyEditing={setIsGloballyEditing}
                canComment={canComment}
                canReact={!isRestrictedMembership}
                canReply={!isRestrictedMembership}
                fromDiscordBot={fromDiscordBot}
                disabledActionsTooltipText={disabledActionsTooltipText}
              />

              <WithDefaultStickyComment>
                {stickyEditor &&
                  thread &&
                  !thread.readOnly &&
                  !fromDiscordBot &&
                  !isGloballyEditing &&
                  user.isLoggedIn && (
                    <CreateComment
                      rootThread={thread}
                      canComment={canComment}
                      tooltipText={
                        typeof disabledActionsTooltipText === 'function'
                          ? disabledActionsTooltipText?.('comment')
                          : disabledActionsTooltipText
                      }
                    />
                  )}
              </WithDefaultStickyComment>

              <StickyCommentElementSelector />
            </>
          }
          editingDisabled={isTopicInContest}
          sidebarComponents={
            [
              ...(showLinkedProposalOptions || showLinkedThreadOptions
                ? [
                    {
                      label: 'Links',
                      item: (
                        <div className="cards-column">
                          {showLinkedProposalOptions && (
                            <LinkedProposalsCard
                              thread={thread!}
                              showAddProposalButton={isAuthor || isAdminOrMod}
                            />
                          )}
                          {showLinkedThreadOptions && (
                            <LinkedThreadsCard
                              thread={thread!}
                              allowLinking={isAuthor || isAdminOrMod}
                            />
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(isAuthor || isAdmin || hasWebLinks
                ? [
                    {
                      label: 'Web Links',
                      item: (
                        <div className="cards-column">
                          <LinkedUrlCard
                            thread={thread!}
                            allowLinking={isAuthor || isAdminOrMod}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(canCreateSnapshotProposal && !hasSnapshotProposal
                ? [
                    {
                      label: 'Snapshot',
                      item: (
                        <div className="cards-column">
                          <SnapshotCreationCard
                            thread={thread!}
                            allowSnapshotCreation={isAuthor || isAdminOrMod}
                            onChangeHandler={handleNewSnapshotChange}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(pollsData?.length > 0 ||
              (isAuthor && (!app.chain?.meta?.admin_only_polling || isAdmin))
                ? [
                    {
                      label: 'Polls',
                      item: (
                        <div className="cards-column">
                          {[
                            ...new Map(
                              pollsData?.map((poll) => [poll.id, poll]),
                            ).values(),
                          ].map((poll: Poll) => {
                            return (
                              <ThreadPollCard
                                poll={poll}
                                key={poll.id}
                                isTopicMembershipRestricted={
                                  isRestrictedMembership
                                }
                                showDeleteButton={isAuthor || isAdmin}
                              />
                            );
                          })}
                          {isAuthor &&
                            (!app.chain?.meta?.admin_only_polling ||
                              isAdmin) && (
                              <ThreadPollEditorCard
                                thread={thread}
                                threadAlreadyHasPolling={!pollsData?.length}
                              />
                            )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ] as SidebarComponents
          }
        />
      </CWPageLayout>
      {JoinCommunityModals}
    </StickCommentProvider>
  );
};

export default ViewThreadPage;
