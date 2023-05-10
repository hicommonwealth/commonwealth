import { MutableRefObject, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';

import Emoji from 'quill-emoji';

console.log('Emoji', Emoji);

const { ShortNameEmoji, ToolbarEmoji, TextAreaEmoji } = Emoji;

// console.log({ ShortNameEmoji, ToolbarEmoji, TextAreaEmoji });

console.log('ShortNameEmoji', ShortNameEmoji);

Quill.register('modules/emoji-shortname', ShortNameEmoji);
// Quill.register('modules/emoji-textarea', TextAreaEmoji);

type UseEmojiProps = {};

export const useEmoji = (props: UseEmojiProps) => {
  const emojiModules = useMemo(() => {
    return {
      'emoji-shortname': true,
      // 'emoji-textarea': true,
    };
  }, []);
  return { emojiModules };
};
