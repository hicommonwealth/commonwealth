/* eslint-disable no-useless-escape */
import 'components/markdown_formatted_text.scss';

import $ from 'jquery';
import m from 'mithril';
import DOMPurify from 'dompurify';
import marked from 'marked';

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  return `<a target="_blank" href="${href}">${text}</a>`;
};

marked.setOptions({
  renderer,
  gfm: true, // use github flavored markdown
  sanitize: true, // extra sanitize pass
  smartypants: true,
  smartLists: true,
  xhtml: true,
});

const MarkdownFormattedText : m.Component<{ doc: string, hideFormatting?: boolean, collapse?: boolean }> = {
  view: (vnode) => {
    const { doc, hideFormatting, collapse } = vnode.attrs;
    if (!doc) return;

    const unsanitized = marked(doc.toString());
    const sanitized = hideFormatting
      ? DOMPurify.sanitize(unsanitized, { ALLOWED_TAGS: ['a'], ADD_ATTR: ['target'] })
      : DOMPurify.sanitize(unsanitized, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
    const results = m.trust(sanitized);

    return m('.MarkdownFormattedText', {
      class: collapse ? 'collapsed' : '',
    }, results);
  }
};

export default MarkdownFormattedText;
