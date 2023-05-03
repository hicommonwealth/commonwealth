import { MinimumProfile } from 'models';
import { RangeStatic } from 'quill';
import { MutableRefObject, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import moment from 'moment';
import QuillMention from 'quill-mention';

import app from 'state';

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
      source: async (
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
        } else if (searchTerm.length > 0) {
          const members = await app.search.searchMentionableAddresses(
            searchTerm,
            {
              pageSize: 10,
              chainScope: app.activeChainId(),
            }
          );
          formattedMatches = members.map((addr) => {
            const profile = app.newProfiles.getProfile(
              addr.chain,
              addr.address
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
              avatar.innerHTML = MinimumProfile.getSVGAvatar(addr.address, 20);
            }

            const nameSpan = document.createElement('span');
            nameSpan.innerText = addr.name;
            nameSpan.className = 'ql-mention-name';

            const addrSpan = document.createElement('span');
            addrSpan.innerText =
              addr.chain === 'near'
                ? addr.address
                : `${addr.address.slice(0, 6)}...`;
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
              link: `/profile/id/${addr.profile_id}`,
              name: addr.name,
              component: node.outerHTML,
            };
          });
        }
        renderList(formattedMatches, searchTerm);
      },
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mention };
};
