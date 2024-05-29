import moment from 'moment';
import { RangeStatic } from 'quill';
import QuillMention from 'quill-mention';
import { MutableRefObject, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import MinimumProfile from '../../../models/MinimumProfile';

import axios from 'axios';
import _ from 'lodash';
import app from 'state';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';

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
      const mentionLength =
        text.slice(0, cursorIdx).split('').reverse().indexOf('@') + 1;
      const beforeText = text.slice(0, cursorIdx - mentionLength);
      const afterText = text.slice(cursorIdx).replace(/\n$/, '');
      const delta = new Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(`[@${item.name}](${item.link})`, { link: item.link });
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

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: ['@'],
      dataAttributes: ['name', 'link', 'component'],
      renderItem: (item) => item.component,
      onSelect: selectMention,
      source: _.debounce(
        async (
          searchTerm: string,
          renderList: (
            formattedMatches: QuillMention,
            searchTerm: string,
          ) => null,
          mentionChar: string,
        ) => {
          if (mentionChar !== '@') return;

          let formattedMatches = [];
          if (searchTerm.length === 0) {
            const node = document.createElement('div');
            const tip = document.createElement('span');
            tip.innerText = 'Type to tag a member';
            node.appendChild(tip);
            formattedMatches = [
              {
                link: '#',
                name: '',
                component: node.outerHTML,
              },
            ];
          } else {
            // try to get results from cache
            const { data } = await axios.get(`${app.serverUrl()}/profiles`, {
              headers: {
                'Content-Type': 'application/json',
              },
              params: {
                chain: app.activeChainId(),
                search: searchTerm,
                limit: '50',
                page: '1',
                order_by: APIOrderBy.LastActive,
                order_direction: APIOrderDirection.Desc,
              },
            });
            const profiles = data?.result?.results;
            formattedMatches = profiles.map((p: any) => {
              const profileId = p.id;
              const profileAddress = p.addresses[0]?.address;
              const profileName = p.profile_name;
              const profileCommunity = p.addresses[0]?.community_id;
              const avatarUrl = p.avatar_url;

              const profile = new MinimumProfile(
                profileAddress,
                profileCommunity,
              );
              profile.initialize(
                profileName,
                profileAddress,
                avatarUrl,
                profileId,
                profileCommunity,
                null,
              );
              const node = document.createElement('div');

              let avatar;
              if (profile.avatarUrl) {
                avatar = document.createElement('img');
                (avatar as HTMLImageElement).src = profile.avatarUrl;
                avatar.className = 'ql-mention-avatar';
                node.appendChild(avatar);
              } else {
                avatar = document.createElement('div');
                avatar.className = 'ql-mention-avatar';
                avatar.innerHTML = MinimumProfile.getSVGAvatar(
                  profileAddress,
                  20,
                );
              }

              const nameSpan = document.createElement('span');
              nameSpan.innerText = p.profile_name;
              nameSpan.className = 'ql-mention-name';

              const addrSpan = document.createElement('span');
              addrSpan.innerText =
                profileCommunity === 'near'
                  ? profileAddress
                  : `${profileAddress.slice(0, 6)}...`;
              addrSpan.className = 'ql-mention-addr';

              const lastActiveSpan = document.createElement('span');
              lastActiveSpan.innerText = profile.lastActive
                ? `Last active ${moment(profile.lastActive).fromNow()}`
                : null;
              lastActiveSpan.className = 'ql-mention-la';

              const textWrap = document.createElement('div');
              textWrap.className = 'ql-mention-text-wrap';

              node.appendChild(avatar);
              textWrap.appendChild(nameSpan);
              textWrap.appendChild(addrSpan);
              textWrap.appendChild(lastActiveSpan);
              node.appendChild(textWrap);

              return {
                link: `/profile/id/${profileId}`,
                name: profileName,
                component: node.outerHTML,
              };
            });
          }
          renderList(formattedMatches, searchTerm);
        },
        500,
      ),
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mention };
};
