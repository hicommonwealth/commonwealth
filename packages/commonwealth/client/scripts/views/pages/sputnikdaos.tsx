/* @jsx m */

import m from 'mithril';
import BN from 'bn.js';
import moment from 'moment';

import 'pages/sputnikdaos.scss';

import app from 'state';
import { formatDuration } from 'helpers';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import Near from 'controllers/chain/near/main';
import { IDaoInfo } from 'controllers/chain/near/chain';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';
import { getClasses } from '../components/component_kit/helpers';

class SputnikDaoRow
  implements
    m.ClassComponent<{
      dao: IDaoInfo;
      clickable: boolean;
    }>
{
  view(vnode) {
    const { dao, clickable } = vnode.attrs;

    const amountString = (app.chain as Near).chain
      .coins(new BN(dao.amount))
      .inDollars.toFixed(2);

    const bondString = (app.chain as Near).chain
      .coins(new BN(dao.proposalBond))
      .inDollars.toFixed(2);

    const periodSeconds = new BN(dao.proposalPeriod).div(
      new BN(10).pow(new BN(9))
    );

    const periodDuration = moment.duration(
      moment.unix(+periodSeconds).diff(moment.unix(0))
    );

    const periodString = formatDuration(periodDuration);

    return (
      <div
        class={getClasses<{ clickable?: boolean }>(
          { clickable },
          'sputnik-row'
        )}
        onclick={(e) => {
          if (clickable) {
            e.preventDefault();
            m.route.set(`/${dao.contractId}`);
          }
        }}
      >
        <CWText className={getClasses<{ clickable?: boolean }>({ clickable })}>
          {dao.name}
        </CWText>
        <CWText>{amountString}</CWText>
        <CWText>{dao.council.length}</CWText>
        <CWText>{bondString}</CWText>
        <CWText>{periodString}</CWText>
      </div>
    );
  }
}

class SputnikDAOsPage implements m.ClassComponent {
  private daosList: IDaoInfo[];
  private daosRequested: boolean;

  view() {
    if (app.activeChainId() && app.activeChainId() !== 'near')
      m.route.set(`/${app.activeChainId()}`);

    const activeEntity = app.chain;
    const allCommunities = app.config.chains.getAll();

    if (!activeEntity)
      return (
        <PageLoading
          message="Loading Sputnik DAOs"
          title={<BreadcrumbsTitleTag title="Sputnik DAOs" />}
          showCreateContentMenuTrigger
        />
      );

    if (
      (app.activeChainId() === 'near' ||
        app.activeChainId() === 'near-testnet') &&
      !this.daosRequested
    ) {
      this.daosRequested = true;
      (app.chain as Near).chain.viewDaoList().then((daos) => {
        const isMainnet = app.activeChainId() === 'near';

        this.daosList = daos;

        this.daosList.sort((d1, d2) => {
          const d1Exist = allCommunities.filter((c) =>
            isMainnet
              ? c.id === `${d1.name}.sputnik-dao.near`
              : c.id === `${d1.name}.sputnikv2.testnet`
          ).length;

          const d2Exist = allCommunities.filter((c) =>
            isMainnet
              ? c.id === `${d2.name}.sputnik-dao.near`
              : c.id === `${d1.name}.sputnikv2.testnet`
          ).length;

          if (d1Exist !== d2Exist) {
            return d2Exist - d1Exist;
          } else {
            return parseFloat(d2.amount) - parseFloat(d1.amount);
          }
        });
        m.redraw();
      });
    }

    if (!this.daosList) {
      if (
        app.activeChainId() === 'near' ||
        app.activeChainId() === 'near-testnet'
      ) {
        return (
          <PageLoading
            message="Loading Sputnik DAOs"
            title={<BreadcrumbsTitleTag title="Sputnik DAOs" />}
            showCreateContentMenuTrigger
          />
        );
      } else return <PageLoading message="Redirecting..." />;
    }

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Sputnik DAOs" />}
        showCreateContentMenuTrigger
      >
        <div class="SputnikDAOsPage">
          <CWText type="h3">Sputnik DAOs</CWText>
          <div class="sputnik-row">
            <CWText fontWeight="medium">Name</CWText>
            <CWText fontWeight="medium">Dao Funds Ⓝ</CWText>
            <CWText fontWeight="medium">Council Size</CWText>
            <CWText fontWeight="medium">Bond Ⓝ</CWText>
            <CWText fontWeight="medium">Vote Period</CWText>
          </div>
          {this.daosList.map((dao) => (
            <SputnikDaoRow
              dao={dao}
              clickable={allCommunities.some((c) => c.id === dao.contractId)}
            />
          ))}
        </div>
      </Sublayout>
    );
  }
}

export default SputnikDAOsPage;
