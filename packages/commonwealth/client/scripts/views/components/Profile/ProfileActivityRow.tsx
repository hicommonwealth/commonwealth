import React from 'react';

import 'components/Profile/ProfileActivityRow.scss';
import moment from 'moment';

import Thread from 'models/Thread';
import withRouter, {
  navigateToCommunity,
  useCommonNavigate,
} from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { CWTag } from '../component_kit/new_designs/CWTag';
import type { CommentWithAssociatedThread } from './ProfileActivity';

type ProfileActivityRowProps = {
  activity: CommentWithAssociatedThread | Thread;
};

const ProfileActivityRow = ({ activity }: ProfileActivityRowProps) => {
  const navigate = useCommonNavigate();
  const { createdAt, author, id } = activity;
  // @ts-expect-error: Allows usage of any
  const communityId =
    (activity as any)?.thread?.community_id || activity?.communityId;
  let title: string;
  let body: string = '';
  if (activity instanceof Thread) {
    title = activity.title;
    body = activity.body;
  }
  const isThread = !!(activity as Thread).kind;
  const comment = activity as CommentWithAssociatedThread;
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });
  const domain = document.location.origin;
  let decodedTitle: string;

  try {
    if (isThread) {
      // @ts-expect-error <StrictNullChecks/>
      decodedTitle = decodeURIComponent(title);
    } else {
      decodedTitle = decodeURIComponent(comment.thread?.title);
    }
  } catch (err) {
    // If we get an error trying to decode URI component, see if it passes when we first encode it.
    // (Maybe it has % Sign in the title)
    try {
      if (isThread) {
        // @ts-expect-error <StrictNullChecks/>
        decodedTitle = decodeURIComponent(encodeURIComponent(title));
      } else {
        decodedTitle = decodeURIComponent(
          encodeURIComponent(comment.thread?.title),
        );
      }
    } catch (e) {
      console.error(
        // @ts-expect-error <StrictNullChecks/>
        `Could not decode title: "${title ? title : comment.thread?.title}"`,
      );
      // @ts-expect-error <StrictNullChecks/>
      decodedTitle = title;
    }
  }

  const renderTrigger = (onclick) => (
    <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
  );

  return (
    <div className="ProfileActivityRow">
      <div className="chain-info">
        <img src={community?.icon_url || ''} alt="chain-logo" />
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
            {moment(createdAt).format('DD/MM/YYYY')}
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
              {/* @ts-expect-error StrictNullChecks*/}
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
          <MarkdownViewerWithFallback
            markdown={isThread ? body : comment.text}
          />
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
