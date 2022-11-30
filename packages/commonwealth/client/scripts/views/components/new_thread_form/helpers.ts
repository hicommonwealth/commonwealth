import app from 'state';
import topics from 'controllers/server/topics';
import { IChainAdapter, ThreadKind, Topic } from 'models';
import { NewThreadFormType, NewThreadErrors } from './types';

export const checkNewThreadErrors = (
  form: NewThreadFormType,
  bodyText?: string
) => {
  if (!form.title) {
    throw new Error(NewThreadErrors.NoTitle);
  }
  if (!form.topic && topics.length > 0) {
    throw new Error(NewThreadErrors.NoTopic);
  }
  if (form.kind === ThreadKind.Discussion && !bodyText.length) {
    throw new Error(NewThreadErrors.NoBody);
  } else if (form.kind === ThreadKind.Link && !form.url) {
    throw new Error(NewThreadErrors.NoUrl);
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
