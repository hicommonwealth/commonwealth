import {
  ContentBlock,
  MarkdownContentBlock,
  TextContentBlock,
} from '@knocklabs/client';
import { Avatar, NotificationCellProps } from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';
import { CWText } from '../component_kit/cw_text';
type WorkflowKey =
  | 'comment-creation'
  | 'snapshot-proposals'
  | 'user-mentioned'
  | 'community-stake'
  | 'chain-event-proposals'
  | 'new-upvote';

const getLinkUrl = (source: { key: WorkflowKey }, data): string => {
  switch (source.key) {
    case 'comment-creation':
      return data?.comment_url;
    case 'user-mentioned':
      return data?.object_url;
    case 'community-stake':
      return data?.community_stakes_url;
    case 'chain-event-proposals':
      return data?.proposal_url;
    case 'new-upvote':
      return data?.object_url;
    case 'snapshot-proposals':
      return data?.snapshot_proposal_url;
    default:
      return `${window.location.origin}/${data?.community_name}`;
  }
};

const CustomNotificationCell = ({ item }: NotificationCellProps) => {
  const contentBlock = item.blocks[0];
  const isRenderableBlock = (
    block: ContentBlock,
  ): block is MarkdownContentBlock | TextContentBlock =>
    block.type === 'markdown' || block.type === 'text';
  const url = getLinkUrl({ key: item.source.key as WorkflowKey }, item.data);
  return (
    <Link to={url} className="CustomNotificationCell container">
      <div className="container">
        {item?.data?.author && (
          <div className="avatar">
            <Avatar name={item?.data?.author} />
          </div>
        )}
        <div className="content">
          {isRenderableBlock(contentBlock) && (
            <div
              className="main-container"
              dangerouslySetInnerHTML={{ __html: contentBlock.rendered }}
            />
          )}
          <CWText fontWeight="regular" type="b2">
            {moment(item?.inserted_at).fromNow()}
          </CWText>
        </div>
      </div>
    </Link>
  );
};
export default CustomNotificationCell;
