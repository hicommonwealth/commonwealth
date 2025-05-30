import { RangeStatic } from 'quill';
import QuillMention from 'quill-mention';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactQuill, { Quill } from 'react-quill';
import MinimumProfile from '../../../models/MinimumProfile';

import { UserTierMap } from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import _ from 'lodash';
import { useUnifiedSearch } from 'state/api/search/useUnifiedSearch';
import {
  DENOTATION_SEARCH_CONFIG,
  ENTITY_TYPE_INDICATORS,
  MENTION_CONFIG,
  MENTION_DENOTATION_CHARS,
  MENTION_LINK_FORMATS,
  MentionEntityType,
  formatEntityDisplayName,
  getEntityId,
  getEntityTypeFromSearchResult,
} from './mention-config';

const Delta = Quill.import('delta');
Quill.register('modules/mention', QuillMention);

type UseMentionProps = {
  editorRef: MutableRefObject<ReactQuill>;
  lastSelectionRef: MutableRefObject<RangeStatic | null>;
};

export const useMention = ({
  editorRef,
  lastSelectionRef,
}: UseMentionProps) => {
  const [mentionTerm, setMentionTerm] = useState('');
  const [currentMentionChar, setCurrentMentionChar] = useState<string>('@');
  const [currentSearchScope, setCurrentSearchScope] = useState<string[]>([
    'All',
  ]);
  const [currentCommunityId, setCurrentCommunityId] = useState<
    string | undefined
  >(undefined);

  // Use refs to avoid React re-renders affecting Quill
  const searchResultsRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const pendingCallbackRef = useRef<{
    renderList: (matches: QuillMention[], searchTerm: string) => null;
    searchTerm: string;
  } | null>(null);

  const { data: searchResults, isLoading } = useUnifiedSearch({
    searchTerm: mentionTerm,
    communityId: currentCommunityId,
    searchScope: currentSearchScope,
    enabled:
      mentionTerm.length >= MENTION_CONFIG.MIN_SEARCH_LENGTH &&
      !!currentMentionChar,
  });

  const selectMention = useCallback(
    (item: QuillMention) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) {
        return;
      }
      if (item.link === '#' && item.name === '') return;

      const text = editor.getText();
      const lastSelection = lastSelectionRef.current;
      if (!lastSelection) {
        return;
      }

      const cursorIdx = lastSelection.index;

      // Find the mention character and calculate mention length
      let mentionChar = currentMentionChar;
      let mentionLength = 0;

      for (const char of Object.keys(MENTION_DENOTATION_CHARS)) {
        const charIndex = text
          .slice(0, cursorIdx)
          .split('')
          .reverse()
          .indexOf(char);
        if (charIndex >= 0) {
          mentionChar = char;
          mentionLength = charIndex + 1;
          break;
        }
      }

      const beforeText = text.slice(0, cursorIdx - mentionLength);
      const afterText = text.slice(cursorIdx).replace(/\n$/, '');

      // Get entity type and format the mention link appropriately
      const entityType = getEntityTypeFromSearchResult(item);
      const entityId = getEntityId(entityType, item);
      const entityName = formatEntityDisplayName(entityType, item);

      const mentionText = MENTION_LINK_FORMATS[entityType](
        entityName,
        entityId,
      );

      const delta = new Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(mentionText, { link: item.link });

      if (!afterText.startsWith(' ')) delta.insert(' ');

      editor.updateContents(delta);
      editor.setSelection(
        editor.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0,
      );
    },
    [editorRef, lastSelectionRef, currentMentionChar],
  );

  const createEntityMentionItem = useCallback(
    (entityType: MentionEntityType, result: any) => {
      const node = document.createElement('div');
      node.className = 'mention-item';

      // Add entity type indicator
      const indicator = document.createElement('span');
      indicator.className = 'mention-entity-indicator';
      indicator.innerText = ENTITY_TYPE_INDICATORS[entityType];
      node.appendChild(indicator);

      // Create content based on entity type
      switch (entityType) {
        case MentionEntityType.USER:
          return createUserMentionItem(result, node);
        case MentionEntityType.TOPIC:
          return createTopicMentionItem(result, node);
        case MentionEntityType.THREAD:
          return createThreadMentionItem(result, node);
        case MentionEntityType.COMMUNITY:
          return createCommunityMentionItem(result, node);
        case MentionEntityType.PROPOSAL:
          return createProposalMentionItem(result, node);
        default:
          return createGenericMentionItem(result, node);
      }
    },
    [],
  );

  const createUserMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const userId = result.id;
      const profileName = result.name;
      const avatarUrl = result.avatar_url;
      const communityName = result.community_name;

      // Create a minimal profile for avatar generation
      const profile = new MinimumProfile('', '');
      profile.initialize(
        userId,
        profileName,
        '',
        avatarUrl,
        '',
        null,
        UserTierMap.IncompleteUser,
      );

      let avatar;
      if (avatarUrl) {
        avatar = document.createElement('img');
        (avatar as HTMLImageElement).src = avatarUrl;
        avatar.className = 'ql-mention-avatar';
      } else {
        avatar = document.createElement('div');
        avatar.className = 'ql-mention-avatar';
        avatar.innerHTML = MinimumProfile.getSVGAvatar('', 20);
      }

      const nameSpan = document.createElement('span');
      nameSpan.innerText = profileName;
      nameSpan.className = 'ql-mention-name';

      const communitySpan = document.createElement('span');
      communitySpan.innerText = communityName || '';
      communitySpan.className = 'ql-mention-addr';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';

      node.appendChild(avatar);
      textWrap.appendChild(nameSpan);
      if (communityName) textWrap.appendChild(communitySpan);
      node.appendChild(textWrap);

      return {
        link: `/profile/id/${userId}`,
        name: profileName,
        component: node.outerHTML,
        type: MentionEntityType.USER,
        id: userId,
        user_id: userId,
        profile_name: profileName,
      };
    },
    [],
  );

  const createTopicMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const topicName = result.name;
      const topicId = result.id;
      const description = result.description || '';
      const status = result.status || '';

      const nameSpan = document.createElement('span');
      nameSpan.innerText = topicName;
      nameSpan.className = 'ql-mention-name';

      const descSpan = document.createElement('span');
      descSpan.innerText =
        description.slice(0, 50) + (description.length > 50 ? '...' : '');
      descSpan.className = 'ql-mention-desc';

      const statusSpan = document.createElement('span');
      statusSpan.innerText = status;
      statusSpan.className = 'ql-mention-status';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(nameSpan);
      if (description) textWrap.appendChild(descSpan);
      if (status) textWrap.appendChild(statusSpan);
      node.appendChild(textWrap);

      return {
        link: `/discussion/topic/${topicId}`,
        name: topicName,
        component: node.outerHTML,
        type: MentionEntityType.TOPIC,
        id: topicId,
        topic_id: topicId,
        topic_name: topicName,
      };
    },
    [],
  );

  const createThreadMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const threadTitle = result.name;
      const threadId = result.id;
      const author = result.author;
      const communityName = result.community_name;

      const titleSpan = document.createElement('span');
      titleSpan.innerText = threadTitle;
      titleSpan.className = 'ql-mention-name';

      const authorSpan = document.createElement('span');
      authorSpan.innerText = author ? `by ${author}` : '';
      authorSpan.className = 'ql-mention-desc';

      const communitySpan = document.createElement('span');
      communitySpan.innerText = communityName ? `in ${communityName}` : '';
      communitySpan.className = 'ql-mention-addr';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(titleSpan);
      if (author) textWrap.appendChild(authorSpan);
      if (communityName) textWrap.appendChild(communitySpan);
      node.appendChild(textWrap);

      return {
        link: `/discussion/${threadId}`,
        name: threadTitle,
        component: node.outerHTML,
        type: MentionEntityType.THREAD,
        id: threadId,
        thread_id: threadId,
        title: threadTitle,
      };
    },
    [],
  );

  const createCommunityMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const communityName = result.name;
      const communityResultId = result.id;
      const memberCount = result.member_count || 0;
      const status = result.status;

      const nameSpan = document.createElement('span');
      nameSpan.innerText = communityName;
      nameSpan.className = 'ql-mention-name';

      const memberSpan = document.createElement('span');
      memberSpan.innerText = `${memberCount} members`;
      memberSpan.className = 'ql-mention-desc';

      const statusSpan = document.createElement('span');
      statusSpan.innerText = status || '';
      statusSpan.className = 'ql-mention-status';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(nameSpan);
      textWrap.appendChild(memberSpan);
      if (status) textWrap.appendChild(statusSpan);
      node.appendChild(textWrap);

      return {
        link: `/${communityResultId}`,
        name: communityName,
        component: node.outerHTML,
        type: MentionEntityType.COMMUNITY,
        id: communityResultId,
        community_id: communityResultId,
      };
    },
    [],
  );

  const createProposalMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const proposalTitle = result.name;
      const proposalId = result.id;
      const status = result.status || 'Unknown';

      const titleSpan = document.createElement('span');
      titleSpan.innerText = proposalTitle;
      titleSpan.className = 'ql-mention-name';

      const statusSpan = document.createElement('span');
      statusSpan.innerText = `Status: ${status}`;
      statusSpan.className = 'ql-mention-desc';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(titleSpan);
      textWrap.appendChild(statusSpan);
      node.appendChild(textWrap);

      return {
        link: `/proposal/${proposalId}`,
        name: proposalTitle,
        component: node.outerHTML,
        type: MentionEntityType.PROPOSAL,
        id: proposalId,
        proposal_id: proposalId,
        title: proposalTitle,
      };
    },
    [],
  );

  const createGenericMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const name = result.name || result.title || 'Unknown';
      const id = result.id || '';

      const nameSpan = document.createElement('span');
      nameSpan.innerText = name;
      nameSpan.className = 'ql-mention-name';

      node.appendChild(nameSpan);

      return {
        link: `#${id}`,
        name: name,
        component: node.outerHTML,
        id: id,
      };
    },
    [],
  );

  // Update refs when search results change
  useEffect(() => {
    searchResultsRef.current = searchResults;
    isLoadingRef.current = isLoading;

    // Clear pending callback if search term is too short
    if (mentionTerm.length < MENTION_CONFIG.MIN_SEARCH_LENGTH) {
      pendingCallbackRef.current = null;
      return;
    }

    // Only process if we have a valid search term and pending callback
    if (
      pendingCallbackRef.current &&
      searchResults &&
      !isLoading &&
      mentionTerm.length >= MENTION_CONFIG.MIN_SEARCH_LENGTH
    ) {
      try {
        const results = searchResults.results || [];
        const formattedMatches = results.map((result: any) => {
          const entityType = getEntityTypeFromSearchResult(result);
          return createEntityMentionItem(entityType, result);
        });

        pendingCallbackRef.current.renderList(
          formattedMatches,
          pendingCallbackRef.current.searchTerm,
        );
        pendingCallbackRef.current = null; // Clear the callback
      } catch (error) {
        console.error('Error processing search results:', error);
        if (pendingCallbackRef.current) {
          pendingCallbackRef.current.renderList(
            [],
            pendingCallbackRef.current.searchTerm,
          );
          pendingCallbackRef.current = null;
        }
      }
    }
  }, [searchResults, isLoading, createEntityMentionItem, mentionTerm]);

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: Object.keys(MENTION_DENOTATION_CHARS),
      dataAttributes: [
        'name',
        'link',
        'component',
        'type',
        'id',
        'user_id',
        'topic_id',
        'thread_id',
        'community_id',
        'proposal_id',
        'profile_name',
        'topic_name',
        'title',
      ],
      renderItem: (item) => item.component,
      onSelect: selectMention,
      source: _.debounce(
        async (
          searchTerm: string,
          renderList: (
            formattedMatches: QuillMention[],
            searchTerm: string,
          ) => null,
          mentionChar: string,
        ) => {
          setCurrentMentionChar(mentionChar);

          // Get search configuration for this denotation character
          const mentionSearchConfig = DENOTATION_SEARCH_CONFIG[mentionChar];
          if (!mentionSearchConfig) return;

          if (searchTerm.length < MENTION_CONFIG.MIN_SEARCH_LENGTH) {
            // Don't update search state for short terms to avoid unnecessary re-renders
            // Only show the tip message
            const node = document.createElement('div');
            const tip = document.createElement('span');
            tip.innerText = `Type to ${mentionSearchConfig.description.toLowerCase()}`;
            node.appendChild(tip);
            const formattedMatches: QuillMention[] = [
              {
                link: '#',
                name: '',
                component: node.outerHTML,
              },
            ];
            renderList(formattedMatches, searchTerm);
          } else {
            // Only update search configuration and term for valid searches
            setCurrentSearchScope(mentionSearchConfig.scopes || ['All']);
            setCurrentCommunityId(
              mentionSearchConfig.communityScoped
                ? app.activeChainId() || ''
                : undefined,
            );

            // Update the search term to trigger the hook
            setMentionTerm(searchTerm);

            // Store the callback to be executed when results are available
            pendingCallbackRef.current = { renderList, searchTerm };
          }
        },
        MENTION_CONFIG.SEARCH_DEBOUNCE_MS,
      ),
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectMention, createEntityMentionItem]);

  return { mention };
};
