/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_external_link.scss';

import { ExternalLinkIcon } from './icons';
import { ComponentType, ExternalLinkProps, State } from './types';

// TODO: Graham 11/17/21 - Synchronize/reconcile against Mithril internal/external link helpers
export const ExternalLink: m.Component<ExternalLinkProps, State> = {
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
