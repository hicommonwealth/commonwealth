import { Avatar } from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import moment from 'moment';
import React from 'react';
import { CWText } from '../component_kit/cw_text';

// eslint-disable-next-line react/no-multi-comp
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomNotificationCell = ({ item }: any) => {
  return (
    <div className="container">
      {item?.data?.author && (
        <div className="avatar">
          <Avatar name={item?.data?.author} />
        </div>
      )}
      <div className="content">
        <div
          className="main-container"
          dangerouslySetInnerHTML={{ __html: item.blocks[0].rendered }}
        />
        <CWText fontWeight="regular" type="b2">
          {moment(item?.inserted_at).fromNow()}
        </CWText>
      </div>
    </div>
  );
};
export default CustomNotificationCell;
