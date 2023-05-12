import { loadScript } from 'helpers';
import { cloneDeep } from 'lodash';
import { DeltaStatic } from 'quill';
import ReactQuill, { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');

class TwitterBlot extends BlockEmbed {
  public static blotName = 'twitter';
  public static className = 'ql-twitter';
  public static tagName = 'div';

  public static create(data) {
    const { id } = data;
    const node = super.create(id);
    node.dataset.id = id;
    const w = window as any;

    const callback = () => {
      setTimeout(() => {
        w.twttr?.widgets?.load();
        w.twttr?.widgets?.createTweet(id, node);
      }, 1);
    };

    if (!w.twttr) {
      loadScript('//platform.twitter.com/widgets.js').then(callback);
    } else {
      callback();
    }
    return node;
  }

  public static value(domNode) {
    const { id } = domNode.dataset;
    return { id };
  }
}

Quill.register('formats/twitter', TwitterBlot);

export const convertTwitterLinksToEmbeds = (
  content: DeltaStatic
): DeltaStatic => {
  const twitterRe =
    /^(?:http[s]?:\/\/)?(?:www[.])?twitter[.]com\/.+?\/status\/(\d+)$/;

  const newContent = cloneDeep(content);

  for (let i = 0; i < (newContent.ops?.length || 0); i++) {
    const op = newContent.ops[i];
    const link = op.attributes?.link || '';
    if (link) {
      const embeddableTweet = twitterRe.test(link);
      if (embeddableTweet) {
        const id = link.match(twitterRe)[1];
        if (typeof id === 'string' && id) {
          newContent.ops[i] = {
            insert: {
              twitter: {
                id,
              },
            },
          };
        }
      }
    }
  }

  return newContent;
};
