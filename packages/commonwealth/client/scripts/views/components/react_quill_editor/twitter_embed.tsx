import { loadScript } from 'helpers';
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
