/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_external_link.scss';

import { ExternalLinkIcon } from './icons';
import { ComponentType } from './types';

export type LinkType = 'button' | 'inline';

type ExternalLinkAttrs = {
  label: string;
  target: string;
  linkType: LinkType;
};

// TODO: Graham 11/17/21 - Synchronize/reconcile against Mithril internal/external link helpers
export const CWExternalLink: m.Component<ExternalLinkAttrs> = {
  view: (vnode) => {
    const { label, target, linkType } = vnode.attrs;
    return (
      <a
        class={`${ComponentType.ExternalLink} ${linkType}`}
        href={target}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{label}</span>
        {m(ExternalLinkIcon)}
      </a>
    );
  },
};
