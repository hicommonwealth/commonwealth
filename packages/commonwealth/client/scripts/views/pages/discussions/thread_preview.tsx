import { IChainEntityKind } from 'chain-events/src';
import {
  isCommandClick,
  isDefaultStage,
  pluralize,
  threadStageToLabel,
} from 'helpers';
import { filterLinks } from 'helpers/threads';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import Thread, { LinkSource } from 'models/Thread';
import moment from 'moment';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/thread_preview.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { slugify } from 'utils';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { Modal } from 'views/components/component_kit/cw_modal';
import { ChangeThreadTopicModal } from 'views/modals/change_thread_topic_modal';
import { ArchiveThreadModal } from 'views/modals/archive_thread_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import AddressInfo from '../../../models/AddressInfo';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTag } from '../../components/component_kit/cw_tag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTooltip } from '../../components/component_kit/cw_popover/cw_tooltip';
import { getClasses } from '../../components/component_kit/helpers';
import { LockWithTooltip } from '../../components/lock_with_tooltip';
import { ThreadPreviewReactionButtonBig } from '../../components/ReactionButton/ThreadPreviewReactionButtonBig';
import { ThreadReactionPreviewButtonSmall } from '../../components/ReactionButton/ThreadPreviewReactionButtonSmall';
import { SharePopover } from '../../components/share_popover';
import { User } from '../../components/user/user';
import {
  getCommentSubscription,
  getReactionSubscription,
  getThreadSubScriptionMenuItem,
  isHot,
} from './helpers';
import { NewThreadTag } from './NewThreadTag';
import { ThreadPreviewMenu } from './thread_preview_menu';

type ThreadPreviewProps = {
  thread: Thread;
};

export const ThreadPreview = ({ thread }: ThreadPreviewProps) => {
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [isUpdateProposalStatusModalOpen, setIsUpdateProposalStatusModalOpen] =
    useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  const { isWindowSmallInclusive } = useBrowserWindow({});

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }
  }, []);

  const [isSubscribed, setIsSubscribed] = useState(
    getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive
  );
  const [isLocked, setIsLocked] = useState(thread.readOnly);

  const [archivedAt, setArchivedAt] = useState(thread.archivedAt);

  const hasAdminPermissions =
    app.user.activeAccount &&
    (app.roles.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    }) ||
      app.roles.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      }));

  const isAuthor =
    app.user.activeAccount && thread.author === app.user.activeAccount.address;

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`
  );

  const isStageDefault = isDefaultStage(thread.stage);
  const isTagsRowVisible =
    (thread.stage && !isStageDefault) || linkedProposals.length > 0;

  const handleStageTagClick = (e) => {
    e.stopPropagation();
    navigate(`/discussions?stage=${thread.stage}`);
  };

  return (
    <>
      <div
        className={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadPreview'
        )}
        onClick={(e) => {
          if (isCommandClick(e)) {
            window.open(`${getScopePrefix()}${discussionLink}`, '_blank');
            return;
          }

          e.preventDefault();

          const scrollEle = document.getElementsByClassName('Body')[0];

          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;

          navigate(discussionLink);
        }}
        key={thread.id}
      >
        {!isWindowSmallInclusive && (
          <ThreadPreviewReactionButtonBig thread={thread} archivedAt={archivedAt} />
        )}
        <div className="main-content">
          <div className="top-row">
            <div className="user-and-date">
              <User
                avatarSize={24}
                user={
                  new AddressInfo(null, thread.author, thread.authorChain, null)
                }
                linkify
                showAddressWithDisplayName
              />
              <CWText className="dot-separator last-updated-text">•</CWText>
              <CWText
                type="caption"
                fontWeight="medium"
                className="last-updated-text"
              >
                {moment(thread.createdAt).format('l')}
              </CWText>
              { archivedAt &&
                (<CWTooltip
                  hasBackground={true}
                  placement="right"
                  content={`Archived on ${thread.archivedAt.format('MM/DD/YYYY')}`}
                  renderTrigger={(handleInteraction) => (
                    <CWIcon
                      iconName="archiveTrayFilled"
                      iconSize="small"
                      onMouseEnter={handleInteraction}
                      onMouseLeave={handleInteraction}
                    />
                  )}
                />)
              }
              <NewThreadTag threadCreatedAt={thread.createdAt} archivedAt={archivedAt} />
              {isHot(thread) && !archivedAt && <CWTag iconName="trendUp" label="Trending" type="trending"/>}
              {isLocked && (
                <LockWithTooltip
                  lockedAt={thread.lockedAt}
                  updatedAt={thread.updatedAt}
                />
              )}
            </div>
            <div className="top-row-icons">
              {thread.pinned && (
                <CWIcon
                  iconName="pin"
                  iconSize='small'
                />
              )}
            </div>
          </div>
          <div className="title-row">
            <CWText type="h5" fontWeight="semiBold">
              {thread.title}
            </CWText>
          </div>
          <div className='top-tags-row'>
            {thread.hasPoll && <CWTag label="Poll" type="poll" />}

            {linkedSnapshots.length > 0 && (
              <CWTag
                type="active"
                label={`Snap ${(linkedSnapshots[0].identifier.includes('/')
                  ? linkedSnapshots[0].identifier.split('/')[1]
                  : linkedSnapshots[0].identifier
                )
                  .toString()
                  .slice(0, 4)}…`}
              />
            )}
          </div>
          <CWText type="caption" className="thread-preview">
            {thread.plaintext}
          </CWText>
          {isTagsRowVisible && (
            <div className="tags-row">
              {thread.stage && !isStageDefault && (
                <CWTag
                  label={threadStageToLabel(thread.stage)}
                  trimAt={20}
                  type="stage"
                  onClick={handleStageTagClick}
                />
              )}
              {linkedProposals
                .sort((a, b) => +a.identifier - +b.identifier)
                .map((link) => (
                  <CWTag
                    key={`${link.source}-${link.identifier}`}
                    type="proposal"
                    label={`${chainEntityTypeToProposalShortName(
                      'proposal' as IChainEntityKind
                    )}
                        ${
                          Number.isNaN(parseInt(link.identifier, 10))
                            ? ''
                            : ` #${link.identifier}`
                        }`}
                  />
                ))}
            </div>
          )}
          <div className="row-bottom">
            <div className="comments">
              {isWindowSmallInclusive && (
                <ThreadReactionPreviewButtonSmall thread={thread} archivedAt={archivedAt} />
              )}
              <CWIcon iconName="comment" iconSize="small" />
              <CWText type="caption">
                {thread.numberOfComments === 0 ? 'Comment' : pluralize(thread.numberOfComments, 'Comment') }
              </CWText>
            </div>
              <div
                className="share"
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SharePopover discussionLink={discussionLink} />
                <CWText type="caption">
                  Share
                </CWText>
              </div>
              <div
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className='subscribe'
              >
                <PopoverMenu
                  menuItems={[
                    getThreadSubScriptionMenuItem(thread, setIsSubscribed, archivedAt),
                  ]}
                  renderTrigger={(onclick) => (
                    <div className='btn-txt-container'>
                      <CWIconButton
                        iconName={isSubscribed ? 'unsubscribe' : 'bellNew'}
                        iconSize="small"
                        onClick={onclick}
                      />
                      <CWText type="caption">
                        Subscribe
                      </CWText>
                    </div>
                  )}
                />
              </div>
              {isLoggedIn && (isAuthor || hasAdminPermissions) && (
                <div
                  className="thread-actions"
                >                
                  <ThreadPreviewMenu
                    thread={thread}
                    setIsChangeTopicModalOpen={setIsChangeTopicModalOpen}
                    setIsUpdateProposalStatusModalOpen={
                      setIsUpdateProposalStatusModalOpen
                    }
                    setIsArchiveModalOpen={setIsArchiveModalOpen}
                    setIsLocked={setIsLocked}
                    archivedAt={archivedAt}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
      <Modal
        content={
          <ChangeThreadTopicModal
            onChangeHandler={() => {
              // TODO update store and rerender
            }}
            thread={thread}
            onModalClose={() => setIsChangeTopicModalOpen(false)}
          />
        }
        onClose={() => setIsChangeTopicModalOpen(false)}
        open={isChangeTopicModalOpen}
      />
      <Modal
        content={
          <UpdateProposalStatusModal
            thread={thread}
            onModalClose={() => setIsUpdateProposalStatusModalOpen(false)}
          />
        }
        onClose={() => setIsUpdateProposalStatusModalOpen(false)}
        open={isUpdateProposalStatusModalOpen}
      />
      <Modal
        content={
          <ArchiveThreadModal
            thread={thread}
            onModalClose={() => setIsArchiveModalOpen(false)}
          />
        }
        onClose={() => setIsArchiveModalOpen(false)}
        open={isArchiveModalOpen}
      />
    </>
  );
};
