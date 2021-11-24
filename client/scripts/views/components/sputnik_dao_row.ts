import 'components/sputnik_dao_row.scss';
import app from 'state';
import m from 'mithril';
import BN from 'bn.js';
import moment from 'moment';
import { formatDuration } from 'helpers';
import { IDaoInfo } from 'controllers/chain/near/chain';
import Near from 'controllers/chain/near/main';

const SputnikDaoRow: m.Component<{
    dao: IDaoInfo;
    clickable: boolean;
}> = {
    view: (vnode) => {
        const { dao, clickable } = vnode.attrs;
        const amountString = (app.chain as Near).chain.coins(new BN(dao.amount)).inDollars.toFixed(2);
        const bondString = (app.chain as Near).chain.coins(new BN(dao.proposalBond)).inDollars.toFixed(2);
        const periodSeconds = (new BN(dao.proposalPeriod)).div(new BN(10).pow(new BN(9)));
        const periodDuration = moment.duration(moment.unix(+periodSeconds).diff(moment.unix(0)))
        const periodString = formatDuration(periodDuration);
        return m('tr.nearRow', {
            class: clickable ? 'clickable' : '',
            onclick: (e) => {
                if (clickable){
                    e.preventDefault();
                    m.route.set(`/${dao.contractId}`);
                }
            }
        }, [
            m('td', {
                class: clickable ? 'link' : '',
            }, dao.name),
            m('td', amountString),
            m('td', dao.council.length),
            m('td', bondString),
            m('td', periodString),
        ])
    }
};

export default SputnikDaoRow;