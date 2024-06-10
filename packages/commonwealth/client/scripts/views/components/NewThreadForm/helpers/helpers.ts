import { notifyError } from 'controllers/app/notifications';
import { ThreadKind } from '../../../../models/types';
import type { NewThreadFormType } from '../types';
import { NewThreadErrors } from '../types';

export const checkNewThreadErrors = (
  { threadTitle, threadKind, threadTopic, threadUrl }: NewThreadFormType,
  bodyText?: string,
  hasTopics?: boolean,
) => {
  if (!threadTitle) {
    return notifyError(NewThreadErrors.NoTitle);
  }

  if (!threadTopic && hasTopics) {
    return notifyError(NewThreadErrors.NoTopic);
  }

  // @ts-expect-error StrictNullChecks
  if (threadKind === ThreadKind.Discussion && !bodyText.length) {
    return notifyError(NewThreadErrors.NoBody);
  } else if (threadKind === ThreadKind.Link && !threadUrl) {
    return notifyError(NewThreadErrors.NoUrl);
  }
};
