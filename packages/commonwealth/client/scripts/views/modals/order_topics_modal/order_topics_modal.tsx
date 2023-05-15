import React, { useState } from 'react';

import 'modals/order_topics_modal.scss';

import { notifyError } from 'controllers/app/notifications';
import type Topic from '../../../models/Topic';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

import DraggableTopicsList from './draggable_topics_list';
import { CWText } from '../../components/component_kit/cw_text';

type OrderTopicsModalProps = {
  onModalClose: () => void;
};

const getSortedTopics = (): Topic[] => {
  const topics = app.topics.store
    .getByCommunity(app.chain.id)
    .filter((topic) => topic.featuredInSidebar)
    .map((topic) => ({ ...topic } as Topic));

  if (!topics.length) return [];

  if (!topics[0].order) {
    return topics
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce((acc, curr, index) => {
        return [...acc, { ...curr, order: index + 1 }];
      }, []);
  } else {
    return topics.sort((a, b) => a.order - b.order);
  }
};

export const OrderTopicsModal = ({ onModalClose }: OrderTopicsModalProps) => {
  const [topics, setTopics] = useState<Topic[]>(() => getSortedTopics());

  const handleSave = async () => {
    try {
      await app.topics.updateFeaturedOrder(topics);
      onModalClose();
      app.sidebarRedraw.emit('redraw');
      app.threads.isFetched.emit('redraw');
    } catch (err) {
      notifyError('Failed to update order');
    }
  };

  return (
    <div className="OrderTopicsModal">
      <div className="compact-modal-title">
        <h3>Reorder Topics</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList topics={topics} setTopics={setTopics} />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
        <CWButton onClick={handleSave} label="Save" />
      </div>
    </div>
  );
};
