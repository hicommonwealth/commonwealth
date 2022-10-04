import m from 'mithril';
import { cast, h /*, useState, a, etcetera */ } from 'cyano-mithril'

interface IAttrs {
  onclick?: () => {};
  href: any;
  text: string;
}

const _LandingPageButton = (attrs: IAttrs) => {
  const { onclick, href, text } = attrs;
  return h(
    'a',
    {
      class: 'btn-outline text-xl rounded-lg pb-2 pt-3 px-3 ',
      href: href,
      onclick: onclick,
      style: 'padding: 8px 16px',
    },
    text
  );
};

const LandingPageButton = cast(_LandingPageButton);

export default LandingPageButton;
