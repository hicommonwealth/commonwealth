import topics from 'controllers/server/topics';
import { ThreadKind } from '../../../../models/types';
import type { NewThreadFormType } from '../types';
import { NewThreadErrors } from '../types';
import { notifyError } from 'controllers/app/notifications';

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
