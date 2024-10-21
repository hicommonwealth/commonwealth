import { PermissionEnum } from '@hicommonwealth/schemas';
import { ContentType, getThreadUrl } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import { extractDomain, isDefaultStage } from 'helpers';
import { commentsByDate } from 'helpers/dates';
import { filterLinks, getThreadActionTooltipText } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/view_thread/index.scss';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import useGetViewCountByObjectIdQuery from 'state/api/general/getViewCountByObjectId';
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
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import Poll from '../../../models/Poll';
import { Link, LinkSource } from '../../../models/Thread';
import { CommentsFeaturedFilterTypes } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
import MetaTags from '../../components/MetaTags';
import { Select } from '../../components/Select';
import type { SidebarComponents } from '../../components/component_kit/CWContentPage';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { CWGatedTopicBanner } from '../../components/component_kit/CWGatedTopicBanner';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
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
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { LockMessage } from './lock_message';
import { SnapshotCreationCard } from './snapshot_creation_card';

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const threadId = identifier.split('-')[0];

  const navigate = useCommonNavigate();

  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentsFeaturedFilterTypes>(CommentsFeaturedFilterTypes.Newest);
  const [isReplying, setIsReplying] = useState(false);
  // @ts-expect-error <StrictNullChecks/>
  const [parentCommentId, setParentCommentId] = useState<number>(null);

  const [hideGatingBanner, setHideGatingBanner] = useState(false);

  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();

  const user = useUserStore();
  const commentsRef = useRef<HTMLDivElement | null>(null);

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
    communityId,
    ids: [+threadId].filter(Boolean),
    apiCallEnabled: !!threadId && !!communityId, // only call the api if we have thread id
  });

  const { data: pollsData = [] } = useGetThreadPollsQuery({
    threadId: +threadId,
    communityId,
    apiCallEnabled: !!threadId && !!communityId,
  });

  const thread = data?.[0];
  const [threadBody, setThreadBody] = useState(thread?.body);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { contestsData } = useCommunityContests();
  const isTopicInContest = checkIsTopicInContest(
    contestsData,
    thread?.topic?.id,
  );

  const { data: comments = [], error: fetchCommentsError } =
    useFetchCommentsQuery({
      communityId,
      threadId: parseInt(`${threadId}`),
      apiEnabled: !!communityId,
    });

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

  const { data: viewCount = 0 } = useGetViewCountByObjectIdQuery({
    communityId,
    objectId: thread?.id || '',
    apiCallEnabled: !!thread?.id && !!communityId,
  });

  useEffect(() => {
    if (fetchCommentsError) notifyError('Failed to load comments');
  }, [fetchCommentsError]);

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
        x?.topics?.find((y) => y.id === thread.topic.id)
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

  if (typeof identifier !== 'string') {
    return <PageNotFound />;
  }

  if (!app.chain?.meta || isLoading) {
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
    // @ts-expect-error <StrictNullChecks/>
    thread.communityId !== app.activeChainId()
  ) {
    return <PageNotFound message="Thread not found" />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  // @ts-expect-error <StrictNullChecks/>
  const isAuthor = Permissions.isThreadAuthor(thread);
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  // @ts-expect-error <StrictNullChecks/>
  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  // @ts-expect-error <StrictNullChecks/>
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);
  // @ts-expect-error <StrictNullChecks/>
  const linkedThreads = filterLinks(thread.links, LinkSource.Thread);

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

  // @ts-expect-error <StrictNullChecks/>
  const hasSnapshotProposal = thread.links.find((x) => x.source === 'snapshot');

  // @ts-expect-error <StrictNullChecks/>
  const hasWebLinks = thread.links.find((x) => x.source === 'web');

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

    if (toAdd.length > 0) {
      try {
        await addThreadLinks({
          communityId,
          // @ts-expect-error <StrictNullChecks/>
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
    // @ts-expect-error <StrictNullChecks/>
    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`,
  );
  // @ts-expect-error <StrictNullChecks/>
  const isStageDefault = isDefaultStage(thread.stage);

  const tabsShouldBePresent =
    showLinkedProposalOptions ||
    showLinkedThreadOptions ||
    pollsData?.length > 0;

  const sortedComments = [...comments]
    .filter((c) => !c.parentComment)
    .sort((a, b) => commentsByDate(a, b, commentSortType));

  const showBanner = !user.activeAccount && isBannerVisible;
  const fromDiscordBot =
    // @ts-expect-error <StrictNullChecks/>
    thread.discord_meta !== null && thread.discord_meta !== undefined;

  const showLocked =
    // @ts-expect-error <StrictNullChecks/>
    (thread.readOnly && !thread.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread =
    user.isLoggedIn &&
    (Permissions.isSiteAdmin() ||
      Permissions.isCommunityAdmin() ||
      Permissions.isCommunityModerator() ||
      // @ts-expect-error <StrictNullChecks/>
      Permissions.isThreadAuthor(thread) ||
      // @ts-expect-error <StrictNullChecks/>
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
    // @ts-expect-error <StrictNullChecks/>
    thread?.title?.length > 60
      ? `${thread?.title?.slice?.(0, 52)}...`
      : thread?.title;
  const ogDescription =
    // @ts-expect-error <StrictNullChecks/>
    getMetaDescription(thread?.body || '')?.length > 155
      ? `${getMetaDescription(thread?.body || '')?.slice?.(0, 152)}...`
      : getMetaDescription(thread?.body || '');
  const ogImageUrl = app?.chain?.meta?.icon_url || '';

  const ScrollToLastComment = () => {
    if (commentsRef?.current) {
      commentsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };
  return (
    // TODO: the editing experience can be improved (we can remove a stale code and make it smooth) - create a ticket
    <>
      <MetaTags
        customMeta={[
          {
            name: 'title',
            // @ts-expect-error <StrictNullChecks/>
            content: ogTitle,
          },
          {
            name: 'description',
            // @ts-expect-error <StrictNullChecks/>
            content: ogDescription,
          },
          {
            name: 'author',
            // @ts-expect-error <StrictNullChecks/>
            content: thread?.author,
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            // @ts-expect-error <StrictNullChecks/>
            content: ogTitle,
          },
          {
            name: 'twitter:description',
            // @ts-expect-error <StrictNullChecks/>
            content: ogDescription,
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
            // @ts-expect-error <StrictNullChecks/>
            content: ogTitle,
          },
          {
            name: 'og:description',
            // @ts-expect-error <StrictNullChecks/>
            content: ogDescription,
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

      <CWPageLayout>
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
          onCommentClick={ScrollToLastComment}
          // @ts-expect-error <StrictNullChecks/>
          isSpamThread={!!thread.markedAsSpamAt}
          title={
            isEditingBody ? (
              <CWTextInput
                onInput={(e) => {
                  setDraftTitle(e.target.value);
                }}
                // @ts-expect-error <StrictNullChecks/>
                value={draftTitle || thread.title}
              />
            ) : (
              // @ts-expect-error <StrictNullChecks/>
              thread.title
            )
          }
          isEditing={isEditingBody}
          // @ts-expect-error <StrictNullChecks/>
          author={
            thread?.author ? app.chain.accounts.get(thread?.author) : null
          }
          // @ts-expect-error <StrictNullChecks/>
          discord_meta={thread.discord_meta}
          // @ts-expect-error <StrictNullChecks/>
          collaborators={thread.collaborators}
          // @ts-expect-error <StrictNullChecks/>
          createdAt={thread.createdAt}
          // @ts-expect-error <StrictNullChecks/>
          updatedAt={thread.updatedAt}
          // @ts-expect-error <StrictNullChecks/>
          lastEdited={thread.lastEdited}
          viewCount={viewCount}
          canUpdateThread={canUpdateThread}
          // @ts-expect-error <StrictNullChecks/>
          stageLabel={!isStageDefault && thread.stage}
          subHeader={
            // @ts-expect-error <StrictNullChecks/>
            !!thread.url && (
              // @ts-expect-error <StrictNullChecks/>
              <ExternalLink url={thread.url}>
                {/* @ts-expect-error StrictNullChecks*/}
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
            if (editsToSave) {
              // @ts-expect-error <StrictNullChecks/>
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
          setThreadBody={setThreadBody}
          body={(threadOptionsComp) => (
            <div className="thread-content">
              {isEditingBody ? (
                <>
                  {/*// TODO editing thread */}
                  <EditBody
                    title={draftTitle}
                    // @ts-expect-error <StrictNullChecks/>
                    thread={thread}
                    savedEdits={savedEdits}
                    shouldRestoreEdits={shouldRestoreEdits}
                    cancelEditing={() => {
                      setIsGloballyEditing(false);
                      setIsEditingBody(false);
                    }}
                    threadUpdatedCallback={() => {
                      setIsGloballyEditing(false);
                      setIsEditingBody(false);
                    }}
                  />
                  {threadOptionsComp}
                </>
              ) : (
                <>
                  <MarkdownViewerUsingQuillOrNewEditor
                    markdown={threadBody ?? thread?.body}
                    cutoffLines={50}
                  />

                  {/* @ts-expect-error StrictNullChecks*/}
                  {thread.readOnly || fromDiscordBot ? (
                    <>
                      {threadOptionsComp}
                      {/* @ts-expect-error StrictNullChecks*/}
                      {!thread.readOnly && thread.markedAsSpamAt && (
                        <div className="callout-text">
                          <CWIcon
                            iconName="flag"
                            weight="fill"
                            iconSize="small"
                          />
                          <CWText type="h5">
                            This thread was flagged as spam on{' '}
                            {/* @ts-expect-error StrictNullChecks*/}
                            {moment(thread.createdAt).format('DD/MM/YYYY')},
                            meaning it can no longer be edited or commented on.
                          </CWText>
                        </div>
                      )}
                      {showLocked && (
                        <LockMessage
                          // @ts-expect-error <StrictNullChecks/>
                          lockedAt={thread.lockedAt}
                          // @ts-expect-error <StrictNullChecks/>
                          updatedAt={thread.updatedAt}
                          fromDiscordBot={fromDiscordBot}
                        />
                      )}
                    </>
                  ) : !isGloballyEditing && user.isLoggedIn ? (
                    <>
                      {threadOptionsComp}
                      <CreateComment
                        // @ts-expect-error <StrictNullChecks/>
                        rootThread={thread}
                        canComment={canComment}
                        tooltipText={
                          typeof disabledActionsTooltipText === 'function'
                            ? disabledActionsTooltipText?.('comment')
                            : disabledActionsTooltipText
                        }
                      />
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
              {comments.length > 0 && (
                <div className="comments-filter-row">
                  <Select
                    key={commentSortType}
                    size="compact"
                    selected={commentSortType}
                    onSelect={(item: any) => {
                      setCommentSortType(item.value);
                    }}
                    options={[
                      {
                        id: 1,
                        value: CommentsFeaturedFilterTypes.Newest,
                        label: 'Newest',
                        iconLeft: 'sparkle',
                      },
                      {
                        id: 2,
                        value: CommentsFeaturedFilterTypes.Oldest,
                        label: 'Oldest',
                        iconLeft: 'clockCounterClockwise',
                      },
                    ]}
                  />
                  <CWCheckbox
                    checked={includeSpamThreads}
                    label="Include comments flagged as spam"
                    // @ts-expect-error <StrictNullChecks/>
                    onChange={(e) => setIncludeSpamThreads(e.target.checked)}
                  />
                </div>
              )}
              <CommentTree
                commentsRef={commentsRef}
                comments={sortedComments}
                includeSpams={includeSpamThreads}
                // @ts-expect-error <StrictNullChecks/>
                thread={thread}
                setIsGloballyEditing={setIsGloballyEditing}
                isReplying={isReplying}
                setIsReplying={setIsReplying}
                parentCommentId={parentCommentId}
                setParentCommentId={setParentCommentId}
                canComment={canComment}
                canReact={!isRestrictedMembership}
                canReply={!isRestrictedMembership}
                fromDiscordBot={fromDiscordBot}
                commentSortType={commentSortType}
                disabledActionsTooltipText={disabledActionsTooltipText}
              />
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
                              // @ts-expect-error <StrictNullChecks/>
                              thread={thread}
                              showAddProposalButton={isAuthor || isAdminOrMod}
                            />
                          )}
                          {showLinkedThreadOptions && (
                            <LinkedThreadsCard
                              // @ts-expect-error <StrictNullChecks/>
                              thread={thread}
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
                            // @ts-expect-error <StrictNullChecks/>
                            thread={thread}
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
                            // @ts-expect-error <StrictNullChecks/>
                            thread={thread}
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
                                // @ts-expect-error <StrictNullChecks/>
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
    </>
  );
};

export default ViewThreadPage;
