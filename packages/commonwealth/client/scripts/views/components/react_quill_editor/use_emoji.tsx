import { MutableRefObject, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';

import Emoji from 'quill-emoji';

Quill.register(
  {
    'formats/emoji': Emoji.EmojiBlot,
    'modules/emoji-toolbar': Emoji.ToolbarEmoji,
    'modules/emoji-textarea': Emoji.TextAreaEmoji,
    'modules/emoji-shortname': Emoji.ShortNameEmoji,
  },
  true
);

type UseEmojiProps = {};

export const useEmoji = (props: UseEmojiProps) => {
  const emojiModules = useMemo(() => {
    return {
      'emoji-shortname': true,
      'emoji-toolbar': true,
      'emoji-textarea': true,
    };
  }, []);
  return { emojiModules };
};
