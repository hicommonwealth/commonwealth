import React from 'react';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import app from '../../../../../state/index';
import { AuthorAndPublishInfo } from '../../../discussions/ThreadCard/AuthorAndPublishInfo/index';
import './index.scss';

const EmbeddedThreadCard = ({
  threadId,
  threadText,
  threadTitle,
  threadAuthor,
}) => {
  // Render the embedded thread card UI
  return (
    <CWCard className="EmbeddedThreadCard">
      <div className="header-container">
        <CWText type="b2" fontWeight="regular" style={{ paddingTop: '4px' }}>
          {/* Add your header title here */}
          Original Post on {threadTitle} by &nbsp;
          {!threadAuthor ? (
            threadAuthor
          ) : (
            <AuthorAndPublishInfo
              authorInfo={app.chain.accounts.get(threadAuthor)}
              publishDate={null}
              discord_meta={null}
            />
          )}
          :
        </CWText>
      </div>
      <div className="content">
        {/* Add your embedded thread card UI elements here */}
        <CWText type="caption" className="content-body">
          {threadText
            ? threadText
            : `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            pellentesque, nisl quis ultricies ultricies, nunc elit ultricies nunc,
            quis ultricies nisl elit ut nisl. Sed pellentesque, nisl quis
            ultricies ultricies, nunc elit ultricies nunc, quis ultricies nisl
            elit ut nisl.`}
        </CWText>
      </div>
    </CWCard>
  );
};

export default EmbeddedThreadCard;
