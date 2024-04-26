import { ContentType, slugify } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { extractDomain, isDefaultStage } from 'helpers';
import { commentsByDate } from 'helpers/dates';
import { filterLinks, getThreadActionTooltipText } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { getProposalUrlPath } from 'identifiers';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/view_thread/index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import {
  useAddThreadLinksMutation,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import ExternalLink from 'views/components/ExternalLink';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import { useFlag } from '../../../hooks/useFlag';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import Poll from '../../../models/Poll';
import { Link, LinkDisplay, LinkSource } from '../../../models/Thread';
import { CommentsFeaturedFilterTypes } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
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
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { CommentTree } from '../discussions/CommentTree';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import ViewTemplate from '../view_template/view_template';
import { LinkedUrlCard } from './LinkedUrlCard';
import { TemplateActionCard } from './TemplateActionCard';
import { ThreadPollCard } from './ThreadPollCard';
import { ThreadPollEditorCard } from './ThreadPollEditorCard';
import { ViewTemplateFormCard } from './ViewTemplateFormCard';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { LockMessage } from './lock_message';
import { SnapshotCreationCard } from './snapshot_creation_card';

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const proposalTemplatesEnabled = useFlag('proposalTemplates');
  const threadId = identifier.split('-')[0];

  const navigate = useCommonNavigate();

  const { isLoggedIn } = useUserLoggedIn();
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [polls, setPolls] = useState<Array<Poll>>([]);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [viewCount, setViewCount] = useState<number>(null);
  const [initializedPolls, setInitializedPolls] = useState(false);
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentsFeaturedFilterTypes>(CommentsFeaturedFilterTypes.Newest);
  const [isReplying, setIsReplying] = useState(false);
  const [parentCommentId, setParentCommentId] = useState<number>(null);
  const [arePollsFetched, setArePollsFetched] = useState(false);
  const [isViewMarked, setIsViewMarked] = useState(false);

  const [hideGatingBanner, setHideGatingBanner] = useState(false);

  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
  });

  const {
    data,
    error: fetchThreadError,
    isLoading,
  } = useGetThreadsByIdQuery({
    communityId: app.activeChainId(),
    ids: [+threadId].filter(Boolean),
    apiCallEnabled: !!threadId, // only call the api if we have thread id
  });

  const thread = data?.[0];

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { data: comments = [], error: fetchCommentsError } =
    useFetchCommentsQuery({
      communityId: app.activeChainId(),
      threadId: parseInt(`${threadId}`),
    });

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    communityId: app.activeChainId(),
    threadId: parseInt(threadId),
  });

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topicIds.includes(thread?.topic?.id),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topicIds.includes(thread?.topic?.id) && membership.isAllowed,
  );

  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

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
    },
  });

  useEffect(() => {
    if (!initializedPolls && thread?.id) {
      setInitializedPolls(true);
      setPolls(app.polls.getByThreadId(thread?.id));
    }
  }, [initializedPolls, thread?.id]);

  // TODO: unnecessary code - must be in a redirect hook
  useNecessaryEffect(() => {
    if (!thread) {
      return;
    }

    if (thread && identifier !== `${threadId}-${slugify(thread?.title)}`) {
      const url = getProposalUrlPath(
        thread.slug,
        `${threadId}-${slugify(thread?.title)}${window.location.search}`,
        true,
      );
      navigate(url, { replace: true });
    }
  }, [identifier, navigate, thread, thread?.slug, thread?.title, threadId]);
  // ------------

  useNecessaryEffect(() => {
    if (!thread || (thread && arePollsFetched)) {
      return;
    }

    app.polls
      .fetchPolls(app.activeChainId(), thread?.id)
      .then(() => {
        setPolls(app.polls.getByThreadId(thread.id));
        setArePollsFetched(true);
      })
      .catch(() => {
        notifyError('Failed to load polls');
        setPolls([]);
      });
  }, [thread, arePollsFetched]);

  useNecessaryEffect(() => {
    if (!thread || (thread && isViewMarked)) {
      return;
    }

    // load view count
    axios
      .post(`${app.serverUrl()}/viewCount`, {
        community_id: app.activeChainId(),
        object_id: thread.id,
      })
      .then((response) => {
        setViewCount(response?.data?.result?.view_count || 0);
      })
      .catch(() => {
        setViewCount(0);
      })
      .finally(() => {
        setIsViewMarked(true);
      });
  }, [thread, isViewMarked]);

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
    thread.communityId !== app.activeChainId()
  ) {
    return <PageNotFound />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const isAuthor = Permissions.isThreadAuthor(thread);
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);
  const linkedThreads = filterLinks(thread.links, LinkSource.Thread);
  const linkedTemplates = filterLinks(thread.links, LinkSource.Template);

  const showLinkedProposalOptions =
    linkedSnapshots.length > 0 ||
    linkedProposals.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  // Todo who should actually be able to view this
  const canCreateSnapshotProposal =
    app.chain?.meta?.snapshot?.length > 0 && (isAuthor || isAdminOrMod);

  const showLinkedThreadOptions =
    linkedThreads.length > 0 || isAuthor || isAdminOrMod;

  const showTemplateOptions =
    proposalTemplatesEnabled && (isAuthor || isAdminOrMod);
  const showLinkedTemplateOptions =
    proposalTemplatesEnabled && linkedTemplates.length > 0;

  const hasSnapshotProposal = thread.links.find((x) => x.source === 'snapshot');

  const hasWebLinks = thread.links.find((x) => x.source === 'web');

  const canComment = !!hasJoinedCommunity && !isRestrictedMembership;

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
          communityId: app.activeChainId(),
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
    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`,
  );
  const isStageDefault = isDefaultStage(thread.stage);

  const tabsShouldBePresent =
    showLinkedProposalOptions || showLinkedThreadOptions || polls?.length > 0;

  const sortedComments = [...comments]
    .filter((c) => !c.parentComment)
    .sort((a, b) => commentsByDate(a, b, commentSortType));

  const showBanner = !hasJoinedCommunity && isBannerVisible;
  const fromDiscordBot =
    thread.discord_meta !== null && thread.discord_meta !== undefined;

  const showLocked =
    (thread.readOnly && !thread.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread =
    isLoggedIn &&
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
    isCommunityMember: !!hasJoinedCommunity,
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
    action: 'comment',
  });

  return (
    // TODO: the editing experience can be improved (we can remove a stale code and make it smooth) - create a ticket
    <>
      <CWPageLayout>
        <CWContentPage
          showTabs={isCollapsedSize && tabsShouldBePresent}
          contentBodyLabel="Thread"
          showSidebar={
            showLinkedProposalOptions ||
            showLinkedThreadOptions ||
            polls?.length > 0 ||
            isAuthor ||
            !!hasWebLinks
          }
          isSpamThread={!!thread.markedAsSpamAt}
          title={
            isEditingBody ? (
              <CWTextInput
                onInput={(e) => {
                  setDraftTitle(e.target.value);
                }}
                value={draftTitle || thread.title}
              />
            ) : (
              thread.title
            )
          }
          isEditing={isEditingBody}
          author={app.chain.accounts.get(thread.author)}
          discord_meta={thread.discord_meta}
          collaborators={thread.collaborators}
          createdAt={thread.createdAt}
          updatedAt={thread.updatedAt}
          lastEdited={thread.lastEdited}
          viewCount={viewCount}
          canUpdateThread={canUpdateThread}
          stageLabel={!isStageDefault && thread.stage}
          subHeader={
            !!thread.url && (
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
            if (editsToSave) {
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
          body={(threadOptionsComp) => (
            <div className="thread-content">
              {isEditingBody ? (
                <>
                  {/*// TODO editing thread */}
                  <EditBody
                    title={draftTitle}
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
                  <QuillRenderer doc={thread.body} cutoffLines={50} />
                  {showLinkedTemplateOptions &&
                    linkedTemplates[0]?.display !== LinkDisplay.sidebar && (
                      <ViewTemplate
                        contract_address={
                          linkedTemplates[0]?.identifier.split('/')[1]
                        }
                        slug={linkedTemplates[0]?.identifier.split('/')[2]}
                        setTemplateNickname={null}
                        isForm
                      />
                    )}
                  {thread.readOnly || fromDiscordBot ? (
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
                  ) : !isGloballyEditing && isLoggedIn ? (
                    <>
                      {threadOptionsComp}
                      <CreateComment
                        rootThread={thread}
                        canComment={canComment}
                        tooltipText={disabledActionsTooltipText}
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
                    onChange={(e) => setIncludeSpamThreads(e.target.checked)}
                  />
                </div>
              )}
              <CommentTree
                comments={sortedComments}
                includeSpams={includeSpamThreads}
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
                              thread={thread}
                              showAddProposalButton={isAuthor || isAdminOrMod}
                            />
                          )}
                          {showLinkedThreadOptions && (
                            <LinkedThreadsCard
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
                            thread={thread}
                            allowSnapshotCreation={isAuthor || isAdminOrMod}
                            onChangeHandler={handleNewSnapshotChange}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(polls?.length > 0 ||
              (isAuthor && (!app.chain?.meta?.adminOnlyPolling || isAdmin))
                ? [
                    {
                      label: 'Polls',
                      item: (
                        <div className="cards-column">
                          {[
                            ...new Map(
                              polls?.map((poll) => [poll.id, poll]),
                            ).values(),
                          ].map((poll: Poll) => {
                            return (
                              <ThreadPollCard
                                poll={poll}
                                key={poll.id}
                                onVote={() => setInitializedPolls(false)}
                                isTopicMembershipRestricted={
                                  isRestrictedMembership
                                }
                                showDeleteButton={isAuthor || isAdmin}
                                onDelete={() => {
                                  setInitializedPolls(false);
                                }}
                              />
                            );
                          })}
                          {isAuthor &&
                            (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                              <ThreadPollEditorCard
                                thread={thread}
                                threadAlreadyHasPolling={!polls?.length}
                                onPollCreate={() => setInitializedPolls(false)}
                              />
                            )}
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(showLinkedTemplateOptions &&
              linkedTemplates[0]?.display !== LinkDisplay.inline
                ? [
                    {
                      label: 'View Template',
                      item: (
                        <div className="cards-column">
                          <ViewTemplateFormCard
                            address={
                              linkedTemplates[0]?.identifier.split('/')[1]
                            }
                            slug={linkedTemplates[0]?.identifier.split('/')[2]}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(showTemplateOptions
                ? [
                    {
                      label: 'Template',
                      item: (
                        <div className="cards-column">
                          <TemplateActionCard thread={thread} />
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
