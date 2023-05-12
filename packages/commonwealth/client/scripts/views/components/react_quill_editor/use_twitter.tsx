import { DeltaStatic } from 'quill';
import { MutableRefObject, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic } from './utils';
import { cloneDeep } from 'lodash';

type UseTwitterProps = {
  editorRef: MutableRefObject<ReactQuill>;
  contentDelta: SerializableDeltaStatic;
  setContentDelta: (value: SerializableDeltaStatic) => void;
};

export const useTwitter = ({
  editorRef,
  contentDelta,
  setContentDelta,
}: UseTwitterProps) => {
  // when content changes, replace twitter links with embeds
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) {
      return;
    }
    // skip if markdown enabled
    if (contentDelta.___isMarkdown) {
      return;
    }

    // convert twitter links to embeds
    const twitterRe =
      /^(?:http[s]?:\/\/)?(?:www[.])?twitter[.]com\/.+?\/status\/(\d+)$/;

    const content = cloneDeep(editor.getContents());

    for (let i = 0; i < (content.ops?.length || 0); i++) {
      const op = content.ops[i];
      const link = op.attributes?.link || '';
      if (link) {
        const embeddableTweet = twitterRe.test(link);
        if (embeddableTweet) {
          const id = link.match(twitterRe)[1];
          console.log('id: ', id, editor);
          content.ops[i] = {
            insert: {
              twitter: {
                id,
              },
            },
          };
        }
      }
    }

    console.log(content);

    // editor.setContents(content);

    setContentDelta({
      ...content,
      ___isMarkdown: contentDelta.___isMarkdown,
    });
  }, [editorRef]);
};
