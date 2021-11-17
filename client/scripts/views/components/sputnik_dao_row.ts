import 'components/sputnik_dao_row.scss';

import m from 'mithril';
import { IDaoInfo } from 'views/pages/sputnikdaos';

const SputnikDaoRow: m.Component<{
    dao: IDaoInfo;
    clickable: boolean;
}> = {
    view: (vnode) => {
        const { dao, clickable } = vnode.attrs;
        return m('tr.nearRow', {
            onclick: (e) => {
                if (clickable){
                    e.preventDefault();
                    m.route.set(`/${dao.contractId}`);
                }
            }
        }, [
            m('td', dao.name),
            m('td', dao.amount),
            m('td', dao.council.length),
            m('td', dao.proposalBond),
            m('td', dao.proposalPeriod),
        ])
    }
};

export default SputnikDaoRow;