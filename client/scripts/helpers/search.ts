import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { SearchParams } from '../views/components/search_bar';

export const searchDiscussions = async (
  searchTerm: string,
  params: SearchParams
) => {
  const { resultSize, chainScope, communityScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/search`, {
      chain: chainScope,
      community: communityScope,
      cutoff_date: null, // cutoffDate.toISOString(),
      search: searchTerm,
      results_size: resultSize,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const searchMentionableAddresses = async (
  searchTerm: string,
  params: SearchParams,
  order?: string[]
) => {
  const { resultSize, communityScope, chainScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/bulkAddresses`, {
      chain: chainScope,
      community: communityScope,
      limit: resultSize,
      searchTerm,
      order,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const searchChainsAndCommunities = async (
  searchTerm?: string,
  limit?: number,
) => {
  try {
    const response = await $.get(`${app.serverUrl()}/getCommunitiesAndChains`, {
      searchTerm,
      limit,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const SearchIcon: m.Component<{ isMobile?: boolean }, {}> = {
  view: (vnode) => {
    return m('svg.SearchIcon', {
      width: '15px',
      height: '16px',
      viewBox: '0 0 15 16',
      fill: 'none',
    }, [
      m('path', {
        'fill-rule': 'evenodd',
        'clip-rule': 'evenodd',
        'd': 'M12.9816 7.64497C12.9816 10.9536 10.2994 13.6358 6.9908 13.6358C3.68217 13.6358 1 10.9536 1 7.64497C1 4.33635 3.68217 1.65417 6.9908 1.65417C10.2994 1.65417 12.9816 4.33635 12.9816 7.64497ZM11.5679 12.9292C10.3415 13.9924 8.74129 14.6358 6.9908 14.6358C3.12989 14.6358 0 11.5059 0 7.64497C0 3.78406 3.12989 0.654175 6.9908 0.654175C10.8517 0.654175 13.9816 3.78406 13.9816 7.64497C13.9816 9.39547 13.3382 10.9957 12.275 12.2221L14.5447 14.4917C14.7399 14.687 14.7399 15.0036 14.5447 15.1988C14.3494 15.3941 14.0328 15.3941 13.8376 15.1988L11.5679 12.9292Z',
        // 'fill': 'url(#paint0_linear)',
        'fill': vnode.attrs.isMobile ? 'url(#paint0_linear)' : 'black'
        // Long-term, gradient URL fill should be used on desktop as well as mobile;
        // for unclear reasons, currently failing to display on browsers >767.98px
      }),
      m('defs', [
        m('linearGradient', {
          'id': 'paint0_linear',
          'x1': '14.6911',
          'y1': '0.938204',
          'x2': '2.18429',
          'y2': '13.6179',
          'gradientUnits': 'userSpaceOnUse'
        }, [
          m('stop', { 'stop-color': '#6086D1' }),
          m('stop', { 'offset': '1', 'stop-color': '#B37DBA' })
        ])
      ])
    ]);
  }
};

export const ProposalIcon = {
  view: (vnode) => {
    return m('svg.ProposalIcon', {
      width: '29px',
      height: '25px',
      viewBox: '0 0 29 25',
      fill: 'none'
    }, [
      m('path', {
        'stroke-linecap': 'round',
        'stroke-width': '5',
        'stroke': '#DADADA',
        'd': 'M3 11.5L10.8036 21L26 3'
      }),
    ]);
  }
};

export const DiscussionIcon = {
  view: (vnode) => {
    return m('svg.DiscussionIcon', {
      width: '42px',
      height: '33px',
      viewBox: '0 0 42 33',
      fill: 'none'
    }, [
      m('path', {
        fill: '#DADADA',
        d: 'M20 0C16.6863 0 14 2.68629 14 6C14 9.31371 16.6863 12 20 12H34V16.5C34 16.5 42 11.3995 42 6C42 2.68629 39.3137 0 36 0H20Z'
      }),
      m('path', {
        fill: '#DADADA',
        d: 'M22 16C25.3137 16 28 18.6863 28 22C28 25.3137 25.3137 28 22 28H8V32.5C8 32.5 0 27.3995 0 22C0 18.6863 2.68629 16 6 16H22Z'
      }),
    ]);
  }
};

export const MemberIcon = {
  view: (vnode) => {
    return m('svg.MemberIcon', {
      width: '26px',
      height: '30px',
      viewBox: '0 0 26 30',
      fill: 'none'
    }, [
      m('path', {
        fill: '#DADADA',
        d: 'M13 0.00498695C16.6749 0.138761 18.2553 2.93905 18.2553 5.4C18.2553 8.75422 15.9619 11.1464 13 13.3224C18.2469 17.1773 25.5915 20.3541 26 27C26 27 22.5 30 13.2766 30C4.05319 30 0 27 0 27C0.408496 20.3541 7.75308 17.1773 13 13.3224C10.0381 11.1464 7.74468 8.75422 7.74468 5.4C7.74468 2.93905 9.32509 0.138761 13 0.00498695Z'
      }),
    ]);
  }
};

export const CommunityIcon = {
  view: (vnode) => {
    return m('svg.CommunityIcon', {
      width: '42px',
      height: '33px',
      viewBox: '0 0 42 33',
      fill: 'none'
    }, [
      m('path', {
        fill: '#DADADA',
        d: 'M21 6C21 9.31371 18.3137 12 15 12C11.6863 12 9 9.31371 9 6C9 2.68629 11.6863 0 15 0C18.3137 0 21 2.68629 21 6Z        '
      }),
      m('path', {
        fill: '#DADADA',
        d: 'M30 21C30 24.3137 27.3137 27 24 27C20.6863 27 18 24.3137 18 21C18 17.6863 20.6863 15 24 15C27.3137 15 30 17.6863 30 21Z'
      }),
      m('path', {
        fill: '#DADADA',
        d: 'M12 21C12 24.3137 9.31371 27 6 27C2.68629 27 0 24.3137 0 21C0 17.6863 2.68629 15 6 15C9.31371 15 12 17.6863 12 21Z'
      }),
    ]);
  }
};
