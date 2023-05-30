import { IChainEntityKind } from 'chain-events/src';
import {
  isCommandClick,
  isDefaultStage,
  pluralize,
  threadStageToLabel,
} from 'helpers';
import { filterLinks } from 'helpers/threads';
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
import { Modal } from 'views/components/component_kit/cw_modal';
import { ChangeTopicModal } from 'views/modals/change_topic_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import useBrowserWindow from '../../../hooks/useBrowserWindow';
import AddressInfo from '../../../models/AddressInfo';
import { CWTag } from '../../components/component_kit/cw_tag';
import { CWText } from '../../components/component_kit/cw_text';
import {
  getClasses,
  isWindowSmallInclusive,
} from '../../components/component_kit/helpers';
import { ThreadPreviewReactionButtonBig } from '../../components/ReactionButton/ThreadPreviewReactionButtonBig';
import { ThreadReactionPreviewButtonSmall } from '../../components/ReactionButton/ThreadPreviewReactionButtonSmall';
import { SharePopover } from '../../components/share_popover';
import { User } from '../../components/user/user';
import {
  getCommentSubscription,
  getReactionSubscription,
  handleToggleSubscription,
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

  const [windowIsSmall, setWindowIsSmall] = useState(
    isWindowSmallInclusive(window.innerWidth)
  );

  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  useBrowserWindow({
    onResize: () => setWindowIsSmall(isWindowSmallInclusive(window.innerWidth)),
    resizeListenerUpdateDeps: [],
  });

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
        {!windowIsSmall && <ThreadPreviewReactionButtonBig thread={thread} />}
        <div className="content-wrapper">
          <div className="content-header">
            <div className="user-and-date">
              <User
                avatarSize={24}
                user={
                  new AddressInfo(null, thread.author, thread.authorChain, null)
                }
                linkify
                showAddressWithDisplayName
              />
              {!windowIsSmall && (
                <CWText className="last-updated-text">•</CWText>
              )}
              <CWText
                type="caption"
                fontWeight="medium"
                className="last-updated-text"
              >
                {moment(thread.createdAt).format('l')}
              </CWText>
              <NewThreadTag threadCreatedAt={thread.createdAt} />
              {isLocked && <CWIcon iconName="lock" iconSize="small" />}
            </div>
            <div className="content-header-icons">
              {isHot(thread) && <div className="flame" />}
              {thread.pinned && <CWIcon iconName="pin" iconSize="small" />}
            </div>
          </div>
          <div className="content-body-wrapper">
            <div className="content-title">
              <CWText type="h5" fontWeight="semiBold">
                {thread.title}
              </CWText>
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
            <CWText type="caption" className="content-body">
              {thread.plaintext}
            </CWText>
          </div>
          {isTagsRowVisible && (
            <div className="content-tags">
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
          <div className="content-footer">
            <div className="comments-count">
              {windowIsSmall && (
                <ThreadReactionPreviewButtonSmall thread={thread} />
              )}
              <button className="content-footer-btn">
                <CWIcon color="black" iconName="comment" iconSize="small" />
                <CWText type="caption">
                  {pluralize(thread.numberOfComments, 'comment')}
                </CWText>
              </button>

              <SharePopover
                discussionLink={discussionLink}
                renderTrigger={(onClick) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClick(e);
                    }}
                    className="content-footer-btn"
                  >
                    <CWIcon color="black" iconName="share" iconSize="small" />
                    <CWText type="caption">Share</CWText>
                  </button>
                )}
              />

              <button
                onClick={async (e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                  await handleToggleSubscription(
                    thread,
                    getCommentSubscription(thread),
                    getReactionSubscription(thread),
                    isSubscribed,
                    setIsSubscribed
                  );
                }}
                className="content-footer-btn"
              >
                <CWIcon
                  color="black"
                  iconName={isSubscribed ? 'bellMuted' : 'bell'}
                  iconSize="small"
                />
                <CWText type="caption">
                  {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </CWText>
              </button>
              {isLoggedIn && (isAuthor || hasAdminPermissions) && (
                <ThreadPreviewMenu
                  thread={thread}
                  setIsChangeTopicModalOpen={setIsChangeTopicModalOpen}
                  setIsUpdateProposalStatusModalOpen={
                    setIsUpdateProposalStatusModalOpen
                  }
                  setIsLocked={setIsLocked}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal
        content={
          <ChangeTopicModal
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
    </>
  );
};
