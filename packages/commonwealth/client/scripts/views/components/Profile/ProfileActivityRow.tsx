import React from 'react';

import 'components/Profile/ProfileActivityRow.scss';
import moment from 'moment';

import Thread from 'models/Thread';
import withRouter, {
  navigateToCommunity,
  useCommonNavigate,
} from 'navigation/helpers';
import app from 'state';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { CWTag } from '../component_kit/new_designs/CWTag';
import { QuillRenderer } from '../react_quill_editor/quill_renderer';
import type { CommentWithAssociatedThread } from './ProfileActivity';

type ProfileActivityRowProps = {
  activity: CommentWithAssociatedThread | Thread;
};

const ProfileActivityRow = ({ activity }: ProfileActivityRowProps) => {
  const navigate = useCommonNavigate();
  const { communityId, createdAt, author, id } = activity;
  let title: string, body: string;
  if (activity instanceof Thread) {
    title = activity.title;
    body = activity.body;
  }
  const isThread = !!(activity as Thread).kind;
  const comment = activity as CommentWithAssociatedThread;
  const { iconUrl } = app.config.chains.getById(communityId);
  const domain = document.location.origin;
  let decodedTitle: string;

  try {
    if (isThread) {
      decodedTitle = decodeURIComponent(title);
    } else {
      decodedTitle = decodeURIComponent(comment.thread?.title);
    }
  } catch (err) {
    // If we get an error trying to decode URI component, see if it passes when we first encode it.
    // (Maybe it has % Sign in the title)
    try {
      if (isThread) {
        decodedTitle = decodeURIComponent(encodeURIComponent(title));
      } else {
        decodedTitle = decodeURIComponent(
          encodeURIComponent(comment.thread?.title),
        );
      }
    } catch (e) {
      console.error(
        `Could not decode title: "${title ? title : comment.thread?.title}"`,
      );
      decodedTitle = title;
    }
  }

  const renderTrigger = (onclick) => (
    <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
  );

  return (
    <div className="ProfileActivityRow">
      <div className="chain-info">
        <img src={iconUrl} alt="chain-logo" />
        <CWText fontWeight="semiBold" className="link">
          <a
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateToCommunity({
                navigate,
                path: `/discussions`,
                chain: communityId,
              });
            }}
          >
            {communityId}
          </a>
        </CWText>
        <div className="dot">.</div>
        <CWTag label={author.slice(0, 5)} type="disabled" />
        <div className="dot">.</div>
        <div className="date">
          <CWText type="caption" fontWeight="medium">
            {moment(createdAt).format('MM/DD/YYYY')}
          </CWText>
        </div>
      </div>
      <div className="title">
        <CWText fontWeight="semiBold" className="link" noWrap>
          <span>
            {isThread ? 'Created a thread' : 'Commented on the thread'}
            &nbsp;
          </span>
          {isThread ? (
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateToCommunity({
                  navigate,
                  path: `/discussion/${id}`,
                  chain: communityId,
                });
              }}
            >
              {title}
            </a>
          ) : (
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateToCommunity({
                  navigate,
                  path: `/discussion/${comment.thread?.id}?comment=${comment.id}`,
                  chain: communityId,
                });
              }}
            >
              {decodedTitle}
            </a>
          )}
        </CWText>
      </div>
      <div className="content">
        <CWText type="b2" className="gray-text">
          <QuillRenderer doc={isThread ? body : comment.text} />
        </CWText>
        <div className="actions">
          <PopoverMenu
            renderTrigger={renderTrigger}
            menuItems={[
              {
                iconLeft: 'linkPhosphor',
                iconLeftSize: 'regular',
                label: 'Copy link',
                onClick: async () => {
                  if (isThread) {
                    await navigator.clipboard.writeText(
                      `${domain}/${communityId}/discussion/${id}`,
                    );
                    return;
                  }
                  await navigator.clipboard.writeText(
                    `${domain}/${communityId}/discussion/${comment.thread?.id}?comment=${comment.id}`,
                  );
                },
              },
              {
                iconLeft: 'twitterOutline',
                iconLeftSize: 'regular',
                label: 'Share on  X (Twitter)',
                onClick: async () => {
                  if (isThread) {
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${domain}/${communityId}/discussion/${id}`,
                      '_blank',
                    );
                    return;
                  }
                  await window.open(
                    `https://twitter.com/intent/tweet?text=${domain}/${communityId}/discussion/${comment.thread?.id}
                      ?comment=${comment.id}`,
                    '_blank',
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default withRouter(ProfileActivityRow);
