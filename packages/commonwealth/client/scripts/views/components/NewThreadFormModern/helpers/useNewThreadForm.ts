import { useEffect, useMemo, useState } from 'react';

import { useDraft } from 'hooks/useDraft';
import { useSearchParams } from 'react-router-dom';
import type { Topic } from '../../../../models/Topic';
import { ThreadKind } from '../../../../models/types';

type NewThreadDraft = {
  topicId: number;
  title: string;
  body: string;
};

const useNewThreadForm = (communityId: string, topicsForSelector: Topic[]) => {
  const [searchParams] = useSearchParams();
  const topicIdFromUrl: number = parseInt(searchParams.get('topic') || '0');

  const { saveDraft, restoreDraft, clearDraft } = useDraft<NewThreadDraft>(
    `new-thread-${communityId}-info`,
    { keyVersion: 'v3' },
  );
  const [canShowGatingBanner, setCanShowGatingBanner] = useState(true);
  const [canShowTopicPermissionBanner, setCanShowTopicPermissionBanner] =
    useState(true);

  // get restored draft on init
  const restoredDraft: NewThreadDraft | null = useMemo(() => {
    if (!topicsForSelector.length || topicIdFromUrl === 0) {
      return null;
    }
    return restoreDraft();
  }, [restoreDraft, topicsForSelector, topicIdFromUrl]);

  const defaultTopic = useMemo(() => {
    if (topicIdFromUrl) {
      return topicsForSelector.find((t) => t.id === topicIdFromUrl);
    }
    if (restoredDraft?.topicId) {
      return topicsForSelector.find((t) => t.id === restoredDraft.topicId);
    }
    return topicsForSelector.find((t) => t.name.includes('General')) || null;
  }, [restoredDraft, topicsForSelector, topicIdFromUrl]);

  useEffect(() => {
    if (defaultTopic) {
      setThreadTopic(defaultTopic);
    }
  }, [defaultTopic]);

  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion,
  );
  const [threadUrl, setThreadUrl] = useState('');
  // @ts-expect-error StrictNullChecks
  const [threadTopic, setThreadTopic] = useState<Topic>(defaultTopic);
  const [threadTitle, setThreadTitle] = useState(restoredDraft?.title || '');
  const [editorText, setEditorText] = useState<string>(
    restoredDraft?.body ?? '',
  );
  const [isSaving, setIsSaving] = useState(false);

  const isDiscussion = threadKind === ThreadKind.Discussion;
  const disableSave = isSaving;
  const hasTopics = !!topicsForSelector?.length;
  const topicMissing = hasTopics && !threadTopic;
  const titleMissing = !threadTitle;
  const linkContentMissing = !isDiscussion && !threadUrl;
  const contentMissing = editorText.length === 0;

  const isDisabled =
    disableSave ||
    titleMissing ||
    topicMissing ||
    linkContentMissing ||
    contentMissing;

  // on content updated, save draft
  useEffect(() => {
    const draft = {
      topicId: threadTopic?.id || 0,
      title: threadTitle,
      body: editorText,
    };
    if (!draft.topicId && !draft.title && !draft.body) {
      return;
    }
    saveDraft(draft);

    if (!editorText && threadTopic?.default_offchain_template) {
      try {
        const template = JSON.parse(
          decodeURIComponent(threadTopic.default_offchain_template),
        ) as string;
        setEditorText(template);
      } catch (e) {
        console.log(e);
      }
    }

    if (!threadTopic && defaultTopic) {
      setThreadTopic(defaultTopic);
    }
  }, [saveDraft, threadTopic, threadTitle, defaultTopic, editorText]);

  return {
    threadKind,
    setThreadKind,
    threadTitle,
    setThreadTitle,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    editorText,
    setEditorText,
    isSaving,
    setIsSaving,
    isDisabled,
    clearDraft,
    canShowGatingBanner,
    setCanShowGatingBanner,
    canShowTopicPermissionBanner,
    setCanShowTopicPermissionBanner,
  };
};

export default useNewThreadForm;
