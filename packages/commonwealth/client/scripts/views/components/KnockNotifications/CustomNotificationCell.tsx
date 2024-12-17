import {
  ContentBlock,
  MarkdownContentBlock,
  TextContentBlock,
} from '@knocklabs/client';
import { Avatar, NotificationCellProps } from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import moment from 'moment';
import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './CustomNotificationCell.scss';

const CustomNotificationCell = ({ item }: NotificationCellProps) => {
  const contentBlock = item.blocks[0];
  const isRenderableBlock = (
    block: ContentBlock,
  ): block is MarkdownContentBlock | TextContentBlock =>
    block.type === 'markdown' || block.type === 'text';

  return (
    <div className="container">
      <div className="avatars">
        {item?.data?.community_icon_url && (
          <div className="community-avatar">
            <Avatar
              src={item?.data?.community_icon_url}
              name={item?.data?.community_name}
            />
          </div>
        )}
        {item?.data?.author && (
          <div className="author-avatar">
            <Avatar name={item?.data?.author} />
          </div>
        )}
      </div>
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
  );
};
export default CustomNotificationCell;
