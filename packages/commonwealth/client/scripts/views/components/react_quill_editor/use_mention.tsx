import MinimumProfile from '../../../models/MinimumProfile';
import { RangeStatic } from 'quill';
import { MutableRefObject, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import moment from 'moment';
import QuillMention from 'quill-mention';

import app from 'state';
import { debounce } from 'lodash';
import { TTLCache } from '../../../helpers/ttl_cache';

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
  const mentionCache = useMemo(() => {
    return new TTLCache(1_000 * 60, `mentions-${app.activeChainId()}`);
  }, []);

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

      /* This is a lazy implementation */
      const cursorIdx = lastSelection.index;
      const atIndex =
        text.slice(0, cursorIdx).split('').reverse().indexOf('@') + 1;
      const slashIndex =
        text.slice(0, cursorIdx).split('').reverse().indexOf('/') + 1;

      // Updated calculations for mentionLength and mentionChar
      let mentionLength, mentionChar;
      if (atIndex === 0) {
        mentionLength = slashIndex;
        mentionChar = '/';
      } else if (slashIndex === 0) {
        mentionLength = atIndex;
        mentionChar = '@';
      } else {
        mentionLength = Math.min(atIndex, slashIndex);
        mentionChar = atIndex < slashIndex ? '@' : '/';
      }

      const beforeText = text.slice(0, cursorIdx - mentionLength);
      const afterText = text.slice(cursorIdx).replace(/\n$/, '');
      const delta = new Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(`${mentionChar}${item.name}`, { link: item.link }); // Updated to use mentionChar
      if (!afterText.startsWith(' ')) delta.insert(' ');
      editor.updateContents(delta);
      editor.setSelection(
        editor.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0
      );
    },
    [editorRef, lastSelectionRef]
  );

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: ['@', '/'],
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
          if (mentionChar !== '@' && mentionChar !== '/') return;

          let formattedMatches = [];
          if (searchTerm.length === 0) {
            const node = document.createElement('div');
            const tip = document.createElement('span');
            if (mentionChar === '@') tip.innerText = 'Type to tag a member';
            else if (mentionChar === '/')
              tip.innerText = 'Type to tag a persona';
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
            let { profiles } = mentionCache.get(searchTerm) || {};

            if (mentionChar === '/') {
              const { totalCount, personas } = await app.search.searchPersonas(
                searchTerm
              );

              formattedMatches = personas.map((persona) => {
                const node = document.createElement('div');
                const nameSpan = document.createElement('span');
                nameSpan.innerText = persona.name;
                nameSpan.className = 'ql-mention-name';
                node.appendChild(nameSpan);

                return {
                  link: `/personas/${persona.id}`,
                  name: persona.name,
                  component: node.outerHTML,
                };
              });
            } else if (mentionChar === '@') {
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
                const avatarUrl = p.avatar_url;

                const profile = new MinimumProfile(
                  profileAddress,
                  profileChain
                );
                profile.initialize(
                  profileName,
                  profileAddress,
                  avatarUrl,
                  profileId,
                  profileChain,
                  null
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
