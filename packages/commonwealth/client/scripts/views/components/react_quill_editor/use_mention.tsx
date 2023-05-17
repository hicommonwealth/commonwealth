import MinimumProfile from '../../../models/MinimumProfile';
import { RangeStatic } from 'quill';
import { MutableRefObject, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import moment from 'moment';
import QuillMention from 'quill-mention';

import app from 'state';
import { debounce } from 'lodash';
import { MentionCache } from './mention_cache';

// local storage cache for mention search results
const mentionCache = new MentionCache(1_000 * 60);

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
        .insert(`@${item.name}`, { link: item.link });
      if (!afterText.startsWith(' ')) delta.insert(' ');
      editor.updateContents(delta);
      editor.setSelection(
        editor.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0
      );
    },
    [lastSelectionRef]
  );

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: ['@'],
      dataAttributes: ['name', 'link', 'component'],
      renderItem: (item) => item.component,
      onSelect: selectMention,
      source: debounce(
        async (
          searchTerm: string,
          renderList: (
            formattedMatches: QuillMention,
            searchTerm: string
          ) => null,
          mentionChar: string
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
          } else if (searchTerm.length > 2) {
            // try to get results from cache
            let { profiles } = mentionCache.get(searchTerm) || {};
            if (!profiles) {
              const res = await app.search.searchMentionableProfiles(
                searchTerm,
                app.activeChainId()
              );
              if (!res.profiles?.length) {
                return;
              }
              profiles = res.profiles;
              mentionCache.set(searchTerm, res);
            }
            formattedMatches = profiles.map((p: any) => {
              const profileId = p.id;
              const profileAddress = p.addresses[0]?.address;
              const profileName = p.profile_name;
              const profileChain = p.addresses[0]?.chain;

              const profile = new MinimumProfile(profileAddress, profileChain);
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
                  20
                );
              }

              const nameSpan = document.createElement('span');
              nameSpan.innerText = p.profile_name;
              nameSpan.className = 'ql-mention-name';

              const addrSpan = document.createElement('span');
              addrSpan.innerText =
                profileChain === 'near'
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
        500
      ),
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mention };
};
