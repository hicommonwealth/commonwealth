import React, { useState, useEffect } from 'react';

import 'pages/discussions/thread_preview.scss';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import moment from 'moment';

import 'pages/discussions/thread_preview.scss';

import app from 'state';
import { slugify } from 'utils';
import { isCommandClick, pluralize } from 'helpers';
import { AddressInfo } from 'models';
import type { Thread } from 'models';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTag } from '../../components/component_kit/cw_tag';
import {
  getClasses,
  isWindowSmallInclusive,
} from '../../components/component_kit/helpers';
import { ThreadPreviewReactionButtonBig } from '../../components/reaction_button/ThreadPreviewReactionButtonBig';
import { ThreadReactionPreviewButtonSmall } from '../../components/reaction_button/ThreadPreviewReactionButtonSmall';
import { SharePopover } from '../../components/share_popover';
import { User } from '../../components/user/user';
import {
  getCommentSubscription,
  getReactionSubscription,
  getThreadSubScriptionMenuItem,
  isHot,
} from './helpers';
import { ThreadPreviewMenu } from './thread_preview_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import { Modal } from 'views/components/component_kit/cw_modal';
import { ChangeTopicModal } from 'views/modals/change_topic_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import useUserLoggedIn from 'hooks/useUserLoggedIn';

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

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }

    const onResize = () => {
      setWindowIsSmall(isWindowSmallInclusive(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
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

  return (
    <>
      <div
        className={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadPreview'
        )}
        onClick={(e) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`
          );

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
              {isLocked && <CWIcon iconName="lock" iconSize="small" />}
            </div>
            <div className="top-row-icons">
              {isHot(thread) && <div className="flame" />}
              {thread.pinned && (
                <CWIcon
                  iconName="pin"
                  iconSize={windowIsSmall ? 'small' : 'medium'}
                />
              )}
            </div>
          </div>
          <div className="title-row">
            <CWText type="h5" fontWeight="semiBold">
              {thread.title}
            </CWText>
            {thread.hasPoll && <CWTag label="Poll" type="poll" />}

            {thread.snapshotProposal && (
              <CWTag
                type="active"
                label={`Snap ${thread.snapshotProposal.slice(0, 4)}…`}
              />
            )}
          </div>
          <CWText type="caption" className="thread-preview">
            {thread.plaintext}
          </CWText>
          {thread.chainEntities?.length > 0 && (
            <div className="tags-row">
              {thread.chainEntities
                .sort((a, b) => {
                  return +a.typeId - +b.typeId;
                })
                .map((ce) => {
                  if (!chainEntityTypeToProposalShortName(ce.type)) return;
                  return (
                    <CWTag
                      type="proposal"
                      label={`${chainEntityTypeToProposalShortName(ce.type)} 
                        ${
                          Number.isNaN(parseInt(ce.typeId, 10))
                            ? ''
                            : ` #${ce.typeId}`
                        }`}
                    />
                  );
                })}
            </div>
          )}
          <div className="row-bottom">
            <div className="comments-count">
              {windowIsSmall && (
                <ThreadReactionPreviewButtonSmall thread={thread} />
              )}
              <CWIcon iconName="feedback" iconSize="small" />
              <CWText type="caption">
                {pluralize(thread.numberOfComments, 'comment')}
              </CWText>
            </div>
            <div className="row-bottom-menu">
              <div
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SharePopover />
              </div>
              <div
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <PopoverMenu
                  menuItems={[
                    getThreadSubScriptionMenuItem(thread, setIsSubscribed),
                  ]}
                  renderTrigger={(onclick) => (
                    <CWIconButton
                      iconName={isSubscribed ? 'unsubscribe' : 'bell'}
                      iconSize="small"
                      onClick={onclick}
                    />
                  )}
                />
              </div>
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
            onChangeHandler={() => {
              // TODO update store and rerender
            }}
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
