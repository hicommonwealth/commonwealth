import moment from 'moment';
import { RangeStatic } from 'quill';
import QuillMention from 'quill-mention';
import { MutableRefObject, useCallback, useMemo, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import MinimumProfile from '../../../models/MinimumProfile';

import { UserTierMap } from '@hicommonwealth/shared';
import _ from 'lodash';
import app from 'state';
import { useSearchProfilesQuery } from 'state/api/profiles';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';
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

  const { refetch } = useSearchProfilesQuery({
    searchTerm: mentionTerm,
    communityId: app.activeChainId() || '',
    limit: MENTION_CONFIG.MAX_SEARCH_RESULTS,
    enabled:
      mentionTerm.length >= MENTION_CONFIG.MIN_SEARCH_LENGTH &&
      !!app.activeChainId(),
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
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
      const userId = result.user_id;
      const profileAddress = result.addresses?.[0]?.address;
      const profileName = result.profile_name;
      const profileCommunity = result.addresses?.[0]?.community_id;
      const avatarUrl = result.avatar_url;

      const profile = new MinimumProfile(profileAddress, profileCommunity);
      profile.initialize(
        userId,
        profileName,
        profileAddress,
        avatarUrl,
        profileCommunity,
        null,
        UserTierMap.IncompleteUser,
      );

      let avatar;
      if (profile.avatarUrl) {
        avatar = document.createElement('img');
        (avatar as HTMLImageElement).src = profile.avatarUrl;
        avatar.className = 'ql-mention-avatar';
      } else {
        avatar = document.createElement('div');
        avatar.className = 'ql-mention-avatar';
        avatar.innerHTML = MinimumProfile.getSVGAvatar(profileAddress, 20);
      }

      const nameSpan = document.createElement('span');
      nameSpan.innerText = profileName;
      nameSpan.className = 'ql-mention-name';

      const addrSpan = document.createElement('span');
      addrSpan.innerText =
        profileCommunity === 'near'
          ? profileAddress
          : `${profileAddress?.slice(0, 6)}...`;
      addrSpan.className = 'ql-mention-addr';

      const lastActiveSpan = document.createElement('span');
      lastActiveSpan.innerText = profile.lastActive
        ? `Last active ${moment(profile.lastActive).fromNow()}`
        : '';
      lastActiveSpan.className = 'ql-mention-la';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';

      node.appendChild(avatar);
      textWrap.appendChild(nameSpan);
      textWrap.appendChild(addrSpan);
      textWrap.appendChild(lastActiveSpan);
      node.appendChild(textWrap);

      return {
        link: `/profile/id/${userId}`,
        name: profileName,
        component: node.outerHTML,
        type: MentionEntityType.USER,
        user_id: userId,
        profile_name: profileName,
      };
    },
    [],
  );

  const createTopicMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const topicName = result.name || result.topic_name;
      const topicId = result.id || result.topic_id;
      const description = result.description || '';

      const nameSpan = document.createElement('span');
      nameSpan.innerText = topicName;
      nameSpan.className = 'ql-mention-name';

      const descSpan = document.createElement('span');
      descSpan.innerText =
        description.slice(0, 50) + (description.length > 50 ? '...' : '');
      descSpan.className = 'ql-mention-desc';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(nameSpan);
      textWrap.appendChild(descSpan);
      node.appendChild(textWrap);

      return {
        link: `/topic/${topicId}`,
        name: topicName,
        component: node.outerHTML,
        type: MentionEntityType.TOPIC,
        topic_id: topicId,
        topic_name: topicName,
      };
    },
    [],
  );

  const createThreadMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const threadTitle = result.title || result.thread_title;
      const threadId = result.id || result.thread_id;
      const author = result.author || result.created_by;

      const titleSpan = document.createElement('span');
      titleSpan.innerText = threadTitle;
      titleSpan.className = 'ql-mention-name';

      const authorSpan = document.createElement('span');
      authorSpan.innerText = `by ${author}`;
      authorSpan.className = 'ql-mention-desc';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(titleSpan);
      textWrap.appendChild(authorSpan);
      node.appendChild(textWrap);

      return {
        link: `/discussion/${threadId}`,
        name: threadTitle,
        component: node.outerHTML,
        type: MentionEntityType.THREAD,
        thread_id: threadId,
        title: threadTitle,
      };
    },
    [],
  );

  const createCommunityMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const communityName = result.name || result.community_name;
      const communityId = result.id || result.community_id;
      const memberCount = result.member_count || 0;

      const nameSpan = document.createElement('span');
      nameSpan.innerText = communityName;
      nameSpan.className = 'ql-mention-name';

      const memberSpan = document.createElement('span');
      memberSpan.innerText = `${memberCount} members`;
      memberSpan.className = 'ql-mention-desc';

      const textWrap = document.createElement('div');
      textWrap.className = 'ql-mention-text-wrap';
      textWrap.appendChild(nameSpan);
      textWrap.appendChild(memberSpan);
      node.appendChild(textWrap);

      return {
        link: `/${communityId}`,
        name: communityName,
        component: node.outerHTML,
        type: MentionEntityType.COMMUNITY,
        community_id: communityId,
        name: communityName,
      };
    },
    [],
  );

  const createProposalMentionItem = useCallback(
    (result: any, node: HTMLElement) => {
      const proposalTitle = result.title || result.proposal_title;
      const proposalId = result.id || result.proposal_id;
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

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: Object.keys(MENTION_DENOTATION_CHARS),
      dataAttributes: ['name', 'link', 'component', 'type'],
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
          const searchConfig = DENOTATION_SEARCH_CONFIG[mentionChar];
          if (!searchConfig) return;

          let formattedMatches = [];

          if (searchTerm.length < MENTION_CONFIG.MIN_SEARCH_LENGTH) {
            const node = document.createElement('div');
            const tip = document.createElement('span');
            tip.innerText = `Type to ${searchConfig.description.toLowerCase()}`;
            node.appendChild(tip);
            formattedMatches = [
              {
                link: '#',
                name: '',
                component: node.outerHTML,
              },
            ];
          } else {
            setMentionTerm(searchTerm);

            // For now, we'll use the existing user search API
            // TODO: Replace with unified search API that supports all entity types
            if (
              mentionChar === '@' ||
              searchConfig.scopes.includes('Members' as any)
            ) {
              const { data } = await refetch();
              const profiles = data?.pages?.[0]?.results || [];

              formattedMatches = profiles.map((result: any) => {
                const entityType = getEntityTypeFromSearchResult(result);
                return createEntityMentionItem(entityType, result);
              });
            }

            // TODO: Add other entity type searches here
            // This is a placeholder - the actual implementation will need
            // to call different APIs based on the search scope
          }

          renderList(formattedMatches, searchTerm);
        },
        MENTION_CONFIG.SEARCH_DEBOUNCE_MS,
      ),
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createEntityMentionItem, selectMention]);

  return { mention };
};
