import React, { useEffect } from 'react';

import type Near from 'controllers/chain/near/adapter';
import type { IDaoInfo } from 'controllers/chain/near/chain';
import { formatDuration } from 'helpers';

import BN from 'bn.js';
import moment from 'moment';

import 'pages/sputnikdaos.scss';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWText } from '../components/component_kit/cw_text';
import { getClasses } from '../components/component_kit/helpers';
import { useCommonNavigate } from 'navigation/helpers';

type SputnikDaoRowProps = {
  clickable: boolean;
  dao: IDaoInfo;
};

const SputnikDaoRow = (props: SputnikDaoRowProps) => {
  const { dao, clickable } = props;
  const navigate = useCommonNavigate();

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
      className={getClasses<{ clickable?: boolean }>(
        { clickable },
        'sputnik-row'
      )}
      onClick={(e) => {
        if (clickable) {
          e.preventDefault();
          navigate(`/${dao.contractId}`, {}, null);
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
};

const SputnikDAOsPage = () => {
  const navigate = useCommonNavigate();

  const [daosList, setDaosList] = React.useState<Array<IDaoInfo>>();
  const [daosRequested, setDaosRequested] = React.useState<boolean>(false);

  useEffect(() => {
    if (app.activeChainId() && app.activeChainId() !== 'near') {
      navigate(`/`);
    }
  }, [navigate]);

  const activeEntity = app.chain;
  const allCommunities = app.config.chains.getAll();

  if (!activeEntity) return <PageLoading message="Loading Sputnik DAOs" />;

  if (
    (app.activeChainId() === 'near' ||
      app.activeChainId() === 'near-testnet') &&
    !daosRequested
  ) {
    setDaosRequested(true);
    (app.chain as Near).chain.viewDaoList().then((daos) => {
      const isMainnet = app.activeChainId() === 'near';

      setDaosList(daos);

      daosList.sort((d1, d2) => {
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
    });
  }

  if (!daosList) {
    if (
      app.activeChainId() === 'near' ||
      app.activeChainId() === 'near-testnet'
    ) {
      return <PageLoading message="Loading Sputnik DAOs" />;
    } else return <PageLoading message="Redirecting..." />;
  }

  return (
    <Sublayout>
      <div className="SputnikDAOsPage">
        <CWText type="h3">Sputnik DAOs</CWText>
        <div className="sputnik-row">
          <CWText fontWeight="medium">Name</CWText>
          <CWText fontWeight="medium">Dao Funds Ⓝ</CWText>
          <CWText fontWeight="medium">Council Size</CWText>
          <CWText fontWeight="medium">Bond Ⓝ</CWText>
          <CWText fontWeight="medium">Vote Period</CWText>
        </div>
        {daosList.map((dao) => (
          <SputnikDaoRow
            dao={dao}
            clickable={allCommunities.some((c) => c.id === dao.contractId)}
          />
        ))}
      </div>
    </Sublayout>
  );
};

export default SputnikDAOsPage;
