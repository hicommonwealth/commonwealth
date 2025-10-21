import { RangeStatic } from 'quill';
import QuillMention from 'quill-mention';
import { MutableRefObject, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import MinimumProfile from '../../../models/MinimumProfile';

import { MCP_MENTION_SYMBOL, UserTierMap } from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import _ from 'lodash';
import { trpc } from 'utils/trpcClient';
import {
  DENOTATION_SEARCH_CONFIG,
  ENTITY_TYPE_INDICATORS,
  MCPServerSearchResult,
  MENTION_CONFIG,
  MENTION_DENOTATION_CHARS,
  MENTION_LINK_FORMATS,
  MentionEntityType,
  MentionSearchResult,
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
  const utils = trpc.useUtils();

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

      // For MCP servers, use handle/id format
      const linkIdentifier =
        entityType === MentionEntityType.MCP_SERVER
          ? `${item.handle || 'unknown'}/${entityId}`
          : entityId;

      const mentionText = MENTION_LINK_FORMATS[entityType](
        entityName,
        linkIdentifier,
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
    (entityType: MentionEntityType, result: MentionSearchResult) => {
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
        case MentionEntityType.MCP_SERVER:
          return createMCPServerMentionItem(result, node);
        default:
          return createGenericMentionItem(result, node);
      }
    },
    [],
  );

  const createUserMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
    const userId = result.id;
    const profileName = result.name;
    const avatarUrl = result.avatar_url;
    const communityName = result.community_name;

    // Create a minimal profile for avatar generation
    const profile = new MinimumProfile('', '');
    profile.initialize(
      Number(userId),
      profileName,
      '',
      avatarUrl || '',
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

  const createTopicMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
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

  const createThreadMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
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

  const createCommunityMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
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

  const createProposalMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
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

  const createMCPServerMentionItem = (
    result: MCPServerSearchResult | MentionSearchResult,
    node: HTMLElement,
  ) => {
    const serverName = result.name;
    const serverId = result.id;
    const serverHandle =
      'handle' in result && result.handle ? result.handle : result.name;
    const baseDescription = result.description || 'MCP Server';
    const authUsername =
      'auth_username' in result ? result.auth_username : undefined;
    const description = authUsername
      ? `${baseDescription}\n\nConnected by ${authUsername}`
      : baseDescription;

    const nameSpan = document.createElement('span');
    nameSpan.innerText = serverHandle;
    nameSpan.className = 'ql-mention-name';

    const descSpan = document.createElement('span');
    descSpan.innerText = description;
    descSpan.className = 'ql-mention-desc';

    const textWrap = document.createElement('div');
    textWrap.className = 'ql-mention-text-wrap';
    textWrap.appendChild(nameSpan);
    textWrap.appendChild(descSpan);
    node.appendChild(textWrap);

    return {
      link: `/mcp-server/${serverHandle}/${serverId}`,
      name: serverName,
      component: node.outerHTML,
      type: MentionEntityType.MCP_SERVER,
      id: serverId,
      mcp_server_id: serverId,
      handle: serverHandle,
      description: description,
    };
  };

  const createGenericMentionItem = (
    result: MentionSearchResult,
    node: HTMLElement,
  ) => {
    const name = result.name || 'Unknown';
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
        'mcp_server_id',
        'profile_name',
        'topic_name',
        'title',
        'handle',
        'description',
      ],
      renderItem: (item) => item.component,
      onSelect: selectMention,
      onOpen: () => {
        justClosed?.(false);
      },
      onClose: () => {
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

            // Skip minimum search length requirement for MCP servers
            if (
              searchTerm.length < MENTION_CONFIG.MIN_SEARCH_LENGTH &&
              mentionChar !== '%'
            ) {
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

            // Handle MCP server search separately
            if (mentionChar === MCP_MENTION_SYMBOL) {
              const communityId = app.activeChainId() || '';
              if (!communityId) {
                renderList([], searchTerm);
                return;
              }

              const mcpData = await utils.mcp.getCommunityMcpServers.fetch({
                community_id: communityId,
              });

              const mcpServers = mcpData || [];

              // Filter MCP servers based on search term
              const filteredServers = mcpServers
                .filter(
                  (server) =>
                    server.name
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    server.handle
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    server.description
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                )
                .slice(0, MENTION_CONFIG.MAX_SEARCH_RESULTS);

              const results: MCPServerSearchResult[] = filteredServers.map(
                (server) => ({
                  id: String(server.id),
                  name: server.name,
                  description: server.description,
                  type: 'mcp_server' as const,
                  created_at: new Date().toISOString(),
                  handle: server.handle,
                  auth_username: server.auth_username,
                }),
              );

              if (results.length === 0) {
                const node = document.createElement('div');
                node.className = 'mention-empty-state';
                node.innerText = `No MCP servers found for "${searchTerm}".`;
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

              const formattedMatches = results.map((result) => {
                const node = document.createElement('div');
                node.className = 'ql-mention-item';
                return createMCPServerMentionItem(result, node);
              });

              renderList(formattedMatches, searchTerm);
              return;
            }

            // Determine search scope and community for regular entities
            const searchScope = mentionSearchConfig.scopes || ['All'];
            const communityId = mentionSearchConfig.communityScoped
              ? app.activeChainId() || ''
              : undefined;

            const data = await utils.search.searchEntities.fetch({
              searchTerm,
              communityId,
              searchScope: searchScope.join(','),
              limit: MENTION_CONFIG.MAX_SEARCH_RESULTS,
              orderBy: 'relevance',
              orderDirection: 'DESC',
              includeCount: false,
            });

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

            const formattedMatches = results.map(
              (result: MentionSearchResult) => {
                const entityType = getEntityTypeFromSearchResult(result);
                return createEntityMentionItem(entityType, result);
              },
            );

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
  }, [selectMention, createEntityMentionItem, justClosed]);

  return { mention };
};
