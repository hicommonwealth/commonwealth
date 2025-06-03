import { RangeStatic } from 'quill';
import QuillMention from 'quill-mention';
import { MutableRefObject, useCallback, useMemo, useRef } from 'react';
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
  justClosed?: (isOpen: boolean) => void;
};

export const useMention = ({
  editorRef,
  lastSelectionRef,
  justClosed,
}: UseMentionProps) => {
  const searchParamsRef = useRef<{
    searchTerm: string;
    communityId?: string;
    searchScope: string[];
  }>({
    searchTerm: '',
    searchScope: ['All'],
  });

  const { refetch } = useUnifiedSearch({
    searchTerm: searchParamsRef.current.searchTerm,
    communityId: searchParamsRef.current.communityId,
    searchScope: searchParamsRef.current.searchScope,
    enabled: false, // We'll trigger manually with refetch
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
      let mentionChar = '';
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
    [editorRef, lastSelectionRef],
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

  const createUserMentionItem = (result: any, node: HTMLElement) => {
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
  };

  const createTopicMentionItem = (result: any, node: HTMLElement) => {
    const topicName = result.name;
    const topicId = result.id;

    const nameSpan = document.createElement('span');
    nameSpan.innerText = topicName;
    nameSpan.className = 'ql-mention-name';

    const textWrap = document.createElement('div');
    textWrap.className = 'ql-mention-text-wrap';
    textWrap.appendChild(nameSpan);
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
  };

  const createThreadMentionItem = (result: any, node: HTMLElement) => {
    const threadTitle = result.name;
    const threadId = result.id;
    const author = result.author;
    const communityName = result.community_name;

    const titleSpan = document.createElement('span');
    titleSpan.innerText = threadTitle;
    titleSpan.className = 'ql-mention-name';

    // Combine author and community name into a single span
    let metaText = '';
    if (author && communityName) {
      metaText = `by ${author} in ${communityName}`;
    } else if (author) {
      metaText = `by ${author}`;
    } else if (communityName) {
      metaText = `in ${communityName}`;
    }
    const metaSpan = document.createElement('span');
    metaSpan.innerText = metaText;
    metaSpan.className = 'ql-mention-desc';

    const textWrap = document.createElement('div');
    textWrap.className = 'ql-mention-text-wrap';
    textWrap.appendChild(titleSpan);
    if (metaText) textWrap.appendChild(metaSpan);
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
  };

  const createCommunityMentionItem = (result: any, node: HTMLElement) => {
    const communityName = result.name;
    const communityResultId = result.id;
    const memberCount = result.member_count || 0;
    const avatarUrl = result.avatar_url;

    let avatar;
    if (avatarUrl) {
      avatar = document.createElement('img');
      (avatar as HTMLImageElement).src = avatarUrl;
      avatar.className = 'ql-mention-avatar';
    } else {
      avatar = document.createElement('div');
      avatar.className = 'ql-mention-avatar';
      avatar.innerText = communityName ? communityName[0].toUpperCase() : '';
    }

    const nameSpan = document.createElement('span');
    nameSpan.innerText = communityName;
    nameSpan.className = 'ql-mention-name';

    const memberSpan = document.createElement('span');
    memberSpan.innerText = `${memberCount} members`;
    memberSpan.className = 'ql-mention-desc';

    const textWrap = document.createElement('div');
    textWrap.className = 'ql-mention-text-wrap';

    node.appendChild(avatar);
    textWrap.appendChild(nameSpan);
    textWrap.appendChild(memberSpan);
    node.appendChild(textWrap);

    return {
      link: `/${communityResultId}`,
      name: communityName,
      component: node.outerHTML,
      type: MentionEntityType.COMMUNITY,
      id: communityResultId,
      community_id: communityResultId,
    };
  };

  const createProposalMentionItem = (result: any, node: HTMLElement) => {
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
  };

  const createGenericMentionItem = (result: any, node: HTMLElement) => {
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
  };

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
      onOpen: () => {
        justClosed?.(false);
      },
      onClose: (e: Event) => {
        justClosed?.(true);
      },
      source: _.debounce(
        async (
          searchTerm: string,
          renderList: (
            formattedMatches: QuillMention[],
            searchTerm: string,
          ) => null,
          mentionChar: string,
        ) => {
          try {
            // Get search configuration for this denotation character
            const mentionSearchConfig = DENOTATION_SEARCH_CONFIG[mentionChar];
            if (!mentionSearchConfig) {
              renderList([], searchTerm);
              return;
            }

            if (searchTerm.length < MENTION_CONFIG.MIN_SEARCH_LENGTH) {
              const node = document.createElement('div');
              node.className = 'mention-empty-state';
              node.innerText = `Type at least ${MENTION_CONFIG.MIN_SEARCH_LENGTH} characters to 
              ${mentionSearchConfig.description.toLowerCase()}`;
              renderList(
                [
                  {
                    link: '#',
                    name: '',
                    component: node.outerHTML,
                  },
                ],
                searchTerm,
              );
              return;
            }

            // Determine search scope and community
            const searchScope = mentionSearchConfig.scopes || ['All'];
            const communityId = mentionSearchConfig.communityScoped
              ? app.activeChainId() || ''
              : undefined;

            // Update search parameters in ref
            searchParamsRef.current = {
              searchTerm,
              communityId,
              searchScope,
            };

            const { data } = await refetch();

            const results = data?.results || [];
            if (results.length === 0) {
              const node = document.createElement('div');
              node.className = 'mention-empty-state';
              node.innerText = `No results found for "${searchTerm}".`;
              renderList(
                [
                  {
                    link: '#',
                    name: '',
                    component: node.outerHTML,
                  },
                ],
                searchTerm,
              );
              return;
            }

            const formattedMatches = results.map((result: any) => {
              const entityType = getEntityTypeFromSearchResult(result);
              return createEntityMentionItem(entityType, result);
            });

            renderList(formattedMatches, searchTerm);
          } catch (error) {
            console.error('Error searching mentions:', error);
            renderList([], searchTerm);
          }
        },
        MENTION_CONFIG.SEARCH_DEBOUNCE_MS,
      ),
      isolateChar: true,
    };
  }, [selectMention, createEntityMentionItem, refetch, justClosed]);

  return { mention };
};
