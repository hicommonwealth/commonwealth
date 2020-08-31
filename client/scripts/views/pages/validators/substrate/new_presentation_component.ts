
import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { get } from 'lodash';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner, TextArea, Select } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

const model = {
    scroll: 1,
    searchBy: '',
    searchCriteria: {},
    searchByOptions: [{ label: 'Select', value: '' }, { label: 'name', value: 'name' }, { label: 'address', value: 'stash_id' }],
    setValue(result: string) {
        model.searchBy = result;
        model.searchCriteria = {};
    },
    pagination: {
        pageSize: 20,
        currentPageNo: 1,
    },
    currentValidators: {
        pagination: {},
        currentValidators: []
    },
    waitingValidators: {
        pagination: {},
        waitingValidators: []
    },
    currentTab: 'current',
    show: true,
    recordCount: {
        waiting: {
            totalRecords: 0,
            fetchedRecords: 0
        },
        current: {
            totalRecords: 0,
            fetchedRecords: 0
        },
    },
    sortKey: 'exposure.total',
    sortAsc: true,
    async change(mode: string) {
        const current_val: any = await app.staking[mode](model.searchCriteria, model.pagination);
        model[mode][mode] = [...model[mode][mode], ...current_val[mode]];
        console.log("fetched next ", model[mode]);
        model[mode].pagination = { ...model[mode].pagination, ...current_val.pagination };
        m.redraw();
        return;
    },
    async search(mode: string, value: string) {

        let current_data: any;
        current_data = model[mode][mode].filter(row => row.stash_id === value);
        if (current_data.length) {
            model[mode][mode] = current_data;
            m.redraw();
            return;
        }
        current_data = await app.staking[mode](model.searchCriteria, {});
        model[mode][mode] = current_data[mode];
        model[mode].pagination = current_data.pagination;
        m.redraw();
        return;
    },
    onChangeHandler() {
        if (model.currentTab === 'current') {
            model.change('currentValidators');
            return;
        }
        model.change('waitingValidators');
    },
    onSearchHandler(value?: string) {
        // if search box is empty then refresh
        if (!value) {
            model.refresh();
        }
        // if search option is provided
        if (model.searchBy && value) {
            model.searchCriteria = { [model.searchBy]: value };
            if (model.currentTab === 'current') {
                model.search('currentValidators', value);
                return;
            }
            model.search('waitingValidators', value);
        }
    },
    async refresh() {
        const staking = app.staking as any;
        model.currentValidators = await staking.currentValidators({}, {});
        model.waitingValidators = await staking.waitingValidators({}, {});
    },
    sortIcon(key: string) {
        return model.sortKey === key
            ? model.sortAsc
                ? Icons.ARROW_UP
                : Icons.ARROW_DOWN
            : Icons.MINUS;
    },
    reset(index) {
        model.pagination.currentPageNo = 1;
        model.show = true;
        const value = (document.getElementsByName('search')[0] as HTMLInputElement).value;
        if (index === 0) {
            model.currentTab = 'current';
        }
        if (index === 1) {
            model.currentTab = 'waiting';
        }
        if (index > 1)
            model.show = false;
        if (value)
            model.onSearchHandler(value);
    },
    next() {
        if (model.pagination.currentPageNo < Math.ceil(model.recordCount[model.currentTab].totalRecords / model.pagination.pageSize)) {
            model.pagination.currentPageNo++;
            model.onChangeHandler();
        }

    },
    changeSort(key: string) {
        if (key === model.sortKey)
            model.sortAsc = !model.sortAsc;
        model.sortKey = key;
    }
};

export const PresentationComponent_ = {

    oninit: () => {
        model.refresh();
    },
    view: () => {
        let { changeSort, reset, setValue, searchBy, searchByOptions, currentValidators, waitingValidators, recordCount, sortAsc, sortIcon, sortKey, next, onSearchHandler, scroll } = model;

        if (!currentValidators && !waitingValidators)
            return m(Spinner, {
                fill: true,
                message: 'Loading Validators...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
            });

        console.log("current val ", model['currentValidators']);
        console.log("waiting model ", model['waitingValidators']);
        const chain = app.chain as Substrate;
        recordCount['current'].totalRecords = (currentValidators?.pagination as any).totalRecords;
        recordCount['waiting'].totalRecords = (waitingValidators?.pagination as any).totalRecords;

        recordCount['current'].fetchedRecords = currentValidators?.currentValidators.length;
        recordCount['waiting'].fetchedRecords = waitingValidators?.waitingValidators.length;

        let current_validators = currentValidators.currentValidators;
        let waiting_validators = waitingValidators.waitingValidators;

        const lastHeaders = (app.chain.base === ChainBase.Substrate)
            ? (app.chain as Substrate).staking.lastHeaders
            : [];

        current_validators = current_validators
            .sort((val1, val2) => {
                if (sortAsc)
                    return get(val2, sortKey, 0) - get(val1, sortKey, 0);
                return get(val1, sortKey, 0) - get(val2, sortKey, 0);
            });
        waiting_validators = waiting_validators
            .sort((val1, val2) => val2.exposure - val1.exposure);


        //onscroll fetch next N record
        $(window).scroll(async function () {
            if (scroll == 1) {
                if ($(window).height() + $(window).scrollTop() == $(document).height()) {
                    scroll = 2;
                    next();
                }
            }
        });

        return m('div',
            m(Select, {
                options: searchByOptions.map(
                    (m_) => ({ value: m_.value, label: m_.label })
                ),
                defaultValue: searchBy,
                value: searchBy,
                onchange: (e) => { setValue((e.target as any).value); },
            }),
            m(TextArea, {
                placeholder: 'Search By name or address',
                id: 'search',
                name: 'search',
                onkeyup: (e) => { onSearchHandler(e.target.value) },
            }),
            m(Tabs, [{
                callback: reset,
                name: 'Current Validators',
                content: m('table.validators-table', [
                    m('tr.validators-heading', [
                        m('th.val-stash', 'Stash'),
                        m('th.val-total', 'Total Stake',
                            m(Icon, {
                                name: sortIcon('exposure.total'),
                                size: 'lg',
                                onclick: () => changeSort('exposure.total')
                            })),
                        m('th.val-own', 'Own Stake',
                            m(Icon, {
                                name: sortIcon('exposure.own'),
                                size: 'lg',
                                onclick: () => changeSort('exposure.own')
                            })),
                        m('th.val-other', 'Other Stake',
                            m(Icon, {
                                name: sortIcon('otherTotal'),
                                size: 'lg',
                                onclick: () => changeSort('otherTotal')
                            })),
                        m('th.val-commission', 'Commission',
                            m(Icon, {
                                name: sortIcon('commissionPer'),
                                size: 'lg',
                                onclick: () => changeSort('commissionPer')
                            })),
                        m('th.val-points', 'Points',
                            m(Icon, {
                                name: sortIcon('eraPoints'),
                                size: 'lg',
                                onclick: () => changeSort('eraPoints')
                            })),
                        m('th.val-apr', 'Est. APR'),
                        m('th.val-last-hash', 'last #'),
                        m('th.val-action', ''),
                    ]),
                    current_validators.map((validator) => {
                        // total stake
                        const total = chain.chain.coins(+validator.exposure.total);
                        // own stake
                        const bonded = chain.chain.coins(+validator.exposure.own);
                        const nominators = validator.exposure.others.map(({ who, value }) => ({
                            stash: who.toString(),
                            balance: chain.chain.coins(+value),
                        }));
                        const stash = validator.stash;
                        const controller = validator.controller;
                        const eraPoints = validator.eraPoints;
                        const blockCount = validator.blockCount;
                        const hasMessage = validator?.hasMessage;
                        const isOnline = validator?.isOnline;
                        const otherTotal = validator?.otherTotal;
                        const commission = validator?.commissionPer;
                        const apr = validator?.apr;
                        // let apr = annualPercentRate[validator];
                        // apr = (apr === -1.0 || typeof apr === 'undefined') ? aprAvg : apr;
                        return m(ValidatorRow, {
                            stash,
                            total,
                            bonded,
                            commission,
                            otherTotal,
                            controller,
                            nominators,
                            eraPoints,
                            blockCount,
                            hasMessage,
                            isOnline,
                            apr
                        });
                    }),
                ])
            }, {
                callback: reset,
                name: 'Waiting Validators',
                content: m('table.validators-table', [
                    m('tr.validators-heading', [
                        m('th.val-stash-waiting', 'Stash'),
                        m('th.val-nominations', 'Nominations'),
                        m('th.val-waiting-commission', 'Commission'),
                        m('th.val-action', ''),
                    ]),
                    waiting_validators.map((validator) => {
                        const stash = validator.stash;
                        const controller = validator.controller;
                        const eraPoints = validator.eraPoints;
                        const toBeElected = validator.toBeElected;
                        const blockCount = validator.blockCount;
                        const hasMessage = validator?.hasMessage;
                        const isOnline = validator?.isOnline;
                        return m(ValidatorRowWaiting, {
                            stash,
                            controller,
                            waiting: true,
                            eraPoints,
                            toBeElected,
                            blockCount,
                            hasMessage,
                            isOnline
                        });
                    }),
                ])
            }, {
                callback: reset,
                name: 'Recent Blocks',
                content: m('table.validators-table', [
                    m('tr.validators-heading', [
                        m('th.val-block-number', 'Block #'),
                        m('th.val-block-hash', 'Hash'),
                        m('th.val-block-author', 'Author')
                    ]),
                    lastHeaders.map((lastHeader) => {
                        if (!lastHeader)
                            return null;
                        return m(RecentBlock, {
                            number: formatNumber(lastHeader.number),
                            hash: lastHeader.hash.toHex(),
                            author: lastHeader.author
                        });
                    })
                ])
            }])
        );
    }
}
export default PresentationComponent_;
// m("button", { class: "btn", onclick: onChangeHandler }, "Search"),