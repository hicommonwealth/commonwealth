import 'components/widgets/popopen_truncated_text.scss';
import { default as m } from 'mithril';

interface IAttrs {
  text: string;
  limit: number;
  disablePopopen?: boolean;
}

interface IState {
  expanded: boolean;
}

const PopopenTruncatedText: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    const { text, limit, disablePopopen } = vnode.attrs;

    if (!text || text.length <= limit || vnode.state.expanded) {
      return m('span.PopopenTruncatedText', text);
    } else {
      const words = text.slice(0, limit).split(' ');
      const lastWord = words.length > 1 ? words[words.length - 1].length : 0;
      const less = limit > 20 && lastWord < 10 ? lastWord + 1 : 0;
      const finalText = text.slice(0, limit - less);
      return m('span.PopopenTruncatedText', [
        finalText,
        disablePopopen ? '...' : [
          ' ',
          m('a.truncated-see-more', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.expanded = true;
            },
          }, 'more...'),
        ],
      ]);
    }
  }
};

export default PopopenTruncatedText;
