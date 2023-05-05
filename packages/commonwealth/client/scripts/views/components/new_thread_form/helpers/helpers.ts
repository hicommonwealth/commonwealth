import topics from 'controllers/server/topics';
import type { IChainAdapter, Topic } from 'models';
import { ThreadKind } from 'models';
import app from 'state';
import type { NewThreadFormType } from '../types';
import { NewThreadErrors } from '../types';
import { notifyError } from 'controllers/app/notifications';
import { vanillaStore } from 'stores/zustand';

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
    const topicNames = vanillaStore
      .getState()
      .getByCommunity(chain.id)
      .map((t) => t.name);

    if (!topicNames.includes(topic.name)) {
      app.topics.store.add(topic);
    }
  } catch (e) {
    console.log(`Error adding new topic to ${chain.name}.`);
  }
};
