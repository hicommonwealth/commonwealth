import { notifyError } from 'controllers/app/notifications';
import topics from 'controllers/server/topics';
import app from 'state';
import type IChainAdapter from '../../../../models/IChainAdapter';
import type Topic from '../../../../models/Topic';
import { ThreadKind } from '../../../../models/types';
import type { NewThreadFormType } from '../types';
import { NewThreadErrors } from '../types';

export const checkNewThreadErrors = (
  { threadTitle, threadKind, threadTopic, threadUrl }: NewThreadFormType,
  bodyText?: string
) => {
  if (!threadTitle) {
    return notifyError(NewThreadErrors.NoTitle);
  }

  if (!threadTopic && topics.length > 0) {
    return notifyError(NewThreadErrors.NoTopic);
  }

  if (threadKind === ThreadKind.Discussion && !bodyText.length) {
    return notifyError(NewThreadErrors.NoBody);
  } else if (threadKind === ThreadKind.Link && !threadUrl) {
    return notifyError(NewThreadErrors.NoUrl);
  }
};

export const updateTopicList = (
  topic: Topic,
  chain: IChainAdapter<any, any>
) => {
  try {
    const topicNames = app.topics.getByCommunity(chain.id).map((t) => t.name);
    if (!topicNames.includes(topic.name)) {
      app.topics.store.add(topic);
    }
  } catch (e) {
    console.log(`Error adding new topic to ${chain.name}.`);
  }
};
