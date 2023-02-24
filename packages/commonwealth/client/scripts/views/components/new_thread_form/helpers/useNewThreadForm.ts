import { useState } from 'react';
import type { DeltaStatic } from 'quill';

import app from 'state';
import { ThreadKind } from 'models';

const useNewThreadForm = (authorName: string, hasTopics: boolean) => {
  const [threadTitle, setThreadTitle] = useState('');
  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion
  );
  //   TODO topic - this is temporary just to make submit pass
  // this should be removed when dropdown with topic will be introduced
  const [threadTopic, setThreadTopic] = useState(
    app.topics.getByCommunity(app.activeChainId())[0]
  );

  const [threadUrl, setThreadUrl] = useState('');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>();
  const [isSaving, setIsSaving] = useState(false);

  const hasOnlyNewLineCharacter = /^\s+$/.test(
    threadContentDelta?.ops?.[0]?.insert
  );

  const isDiscussion = threadKind === ThreadKind.Discussion;
  const disableSave = !authorName || isSaving;
  const topicMissing = hasTopics && !threadTopic;
  const titleMissing = !threadTitle;
  const linkContentMissing = !isDiscussion && !threadUrl;
  const contentMissing = !threadContentDelta || hasOnlyNewLineCharacter;

  const isDisabled =
    disableSave ||
    titleMissing ||
    topicMissing ||
    linkContentMissing ||
    contentMissing;

  return {
    threadKind,
    setThreadKind,
    threadTitle,
    setThreadTitle,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    isSaving,
    setIsSaving,
    isDisabled,
  };
};

export default useNewThreadForm;
