/* @jsx m */

import m from 'mithril';

import 'components/chain_card.scss';

import app from 'state';
import { NodeInfo } from 'models';
import { CWButton } from './component_kit/cw_button';
import { CWCard } from './component_kit/cw_card';
import { CWIconButton } from './component_kit/cw_icon_button';

type ChainCardAttrs = { chain: string; nodeList: NodeInfo[] };

export class ChainCard implements m.ClassComponent<ChainCardAttrs> {
  view(vnode) {
    const { chain, nodeList } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let prettyDescription = '';
    if (chainInfo.description) {
      prettyDescription =
        chainInfo.description[chainInfo.description.length - 1] === '.'
          ? chainInfo.description
          : `${chainInfo.description}.`;
    }

    const iconUrl =
      nodeList[0].chain.iconUrl || (nodeList[0].chain as any).icon_url;

    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="chain-card"
        onclick={redirectFunction}
      >
        <div class="card-header">
          {iconUrl ? (
            <img class="chain-icon" src={iconUrl} />
          ) : (
            <div class="chain-icon no-image" />
          )}
        </div>
        <div class="card-body">
          <div class="community-name" lang="en">
            {chainInfo.name}
          </div>
          <div class="card-description" title={prettyDescription} lang="en">
            {prettyDescription}
          </div>
          <CWButton
            buttonType="secondary-black"
            label="See More"
            onclick={redirectFunction}
          />
          {/* for mobile */}
          <CWIconButton iconName="expand" onclick={redirectFunction} />
        </div>
      </CWCard>
    );
  }
}
