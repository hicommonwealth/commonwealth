/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-len */
import 'components/component_kit/icons.scss';
import m from 'mithril';

export enum IconSize {
  'SM' = '14x14',
  'MD' = '20x20',
  'LG' = '28x28',
}

export enum IconIntent {
  Primary = 'primary',
  Secondary = 'secondary',
}

const appendTags = (className: string, attrs) => {
  const { intent, disabled, size } = attrs;
  let tag = `svg.Icon.${className}`;
  if (disabled) tag += '.disabled';
  else if (intent === IconIntent.Primary) tag += '.primary';
  else if (intent === IconIntent.Secondary) tag += '.secondary';
  if (size === IconSize.SM) tag += '.sm';
  if (size === IconSize.MD) tag += '.md';
  if (size === IconSize.LG) tag += '.lg';
  return tag;
};

export const ArrowDownIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('ArrowDownIcon', vnode.attrs),
      {
        width: '17',
        height: '16',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm14.036 3.671-6.464 7.66-6.465-7.66',
          'stroke-width': '2',
          'stroke-linecap': 'round',
        }),
      ]
    );
  },
};

export const ArrowRightIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('ArrowRightIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm4.027 1.036 7.658 6.465-7.658 6.464',
          'stroke-width': '2',
          'stroke-linecap': 'round',
        }),
      ]
    );
  },
};

export const ReplyIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size, disabled } = vnode.attrs;
    return [
      size === IconSize.SM &&
        m(
          appendTags('ReplyIcon', vnode.attrs),
          {
            width: '17',
            height: '17',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M1.858 14.322a1 1 0 0 0 1.73.684l2.243-2.393h7.185c.624 0 1.208-.265 1.628-.713a2.402 2.402 0 0 0 .642-1.641V3.487c0-.605-.224-1.196-.642-1.642a2.231 2.231 0 0 0-1.628-.713H4.128a2.23 2.23 0 0 0-1.627.713 2.401 2.401 0 0 0-.643 1.642v10.835Z',
              'stroke-width': '2',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
      size === IconSize.MD &&
        m(
          appendTags('ReplyIcon', vnode.attrs),
          {
            width: '21',
            height: '21',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M.84 19.207a.75.75 0 0 0 1.28.53l3.65-3.65H17.07a2.685 2.685 0 0 0 2.684-2.685V3.728a2.685 2.685 0 0 0-2.684-2.685H3.524c-.712 0-1.395.283-1.899.787l.53.53-.53-.53A2.685 2.685 0 0 0 .84 3.728v15.479Z',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
    ];
  },
};

export const ViewsIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('ViewsIcon', vnode.attrs),
      {
        width: '22',
        height: '16',
        fill: 'none',
      },
      [
        m('path', {
          'clip-rule': 'evenodd',
          d: 'M1.01 8s3.564-7 9.802-7c6.237 0 9.801 7 9.801 7s-3.564 7-9.801 7C4.574 15 1.01 8 1.01 8Z',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
        m('path', {
          'clip-rule': 'evenodd',
          d: 'M10.812 11.247c1.826 0 3.306-1.453 3.306-3.246s-1.48-3.247-3.306-3.247-3.306 1.454-3.306 3.247 1.48 3.246 3.306 3.246Z',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      ]
    );
  },
};

export const CreateIcon: m.Component<
  {
    size: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size } = vnode.attrs;
    return [
      size === IconSize.MD &&
        m(
          appendTags('CreateIcon', vnode.attrs),
          {
            width: '23',
            height: '22',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M11.635 1.047v19.906M1.682 11h19.906',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
            }),
          ]
        ),
      size === IconSize.LG &&
        m(
          appendTags('CreateIcon', vnode.attrs),
          {
            width: '29',
            height: '28',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M14.766 2.056v23.887M2.821 14H26.71',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
            }),
          ]
        ),
    ];
  },
};

export const LikesIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size } = vnode.attrs;
    return [
      size === IconSize.SM &&
        m(
          appendTags('LikesIcon', vnode.attrs),
          {
            width: '18',
            height: '16',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M15.868 2.365a4.59 4.59 0 0 0-1.485-.965 4.677 4.677 0 0 0-3.492 0 4.59 4.59 0 0 0-1.485.965s0 0 0 0l-.215.209-.216-.21a4.638 4.638 0 0 0-3.23-1.301c-1.209 0-2.371.466-3.232 1.302a4.418 4.418 0 0 0-1.349 3.169c0 1.193.488 2.332 1.35 3.169l.737.717 5.417 5.262a.75.75 0 0 0 1.045 0L15.13 9.42l.738-.717c.426-.414.766-.907.998-1.451a4.379 4.379 0 0 0 0-3.437 4.465 4.465 0 0 0-.998-1.45Z',
              stroke: '#666',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
      size === IconSize.MD &&
        m(
          appendTags('LikesIcon', vnode.attrs),
          {
            width: '25',
            height: '21',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M11.885 19.571a.75.75 0 0 0 .87 0c1.494-1.068 4.106-3.057 6.352-5.353 1.123-1.147 2.172-2.39 2.945-3.647.768-1.25 1.302-2.579 1.302-3.884A5.897 5.897 0 0 0 17.457.79c-1.56 0-2.94.63-3.921 1.246-.5.313-.914.633-1.214.887-.3-.254-.714-.574-1.214-.887C10.126 1.42 8.746.79 7.186.79 3.92.79 1.338 3.44 1.338 6.687c0 1.302.525 2.628 1.282 3.875.762 1.255 1.798 2.494 2.91 3.64 2.225 2.29 4.823 4.28 6.355 5.37Z',
              stroke: '#000',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
    ];
  },
};

export const ShareIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('ShareIcon', vnode.attrs),
      {
        width: '24',
        height: '22',
        fill: 'none',
      },
      [
        m('path', {
          d: 'M1.588 11.979v6.444c0 .683.244 1.339.678 1.822.433.483 1.022.755 1.636.755h16.196c.613 0 1.202-.272 1.636-.755a2.734 2.734 0 0 0 .677-1.823V11.98M12 11.412V1m0 0 4.877 4.876M11.999 1 7.123 5.876',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      ]
    );
  },
};

export const AccountIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size } = vnode.attrs;
    return [
      size === IconSize.MD &&
        m(
          appendTags('AccountIcon', vnode.attrs),
          {
            width: '21',
            height: '22',
            fill: 'none',
            xmlns: 'http://www.w3.org/2000/svg',
          },
          [
            m('path', {
              d: 'M17.854 20.281v-5.04a4.268 4.268 0 0 0-4.269-4.267H6.423a4.268 4.268 0 0 0-4.269 4.268v5.04',
              stroke: '#999',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
            m('path', {
              d: 'M14.235 6.514a4.252 4.252 0 1 1-8.505 0 4.252 4.252 0 0 1 8.505 0Z',
              stroke: '#999',
              'stroke-width': '1.5',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
      size === IconSize.LG &&
        m(
          appendTags('AccountIcon', vnode.attrs),
          {
            width: '31',
            height: '30',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M27.483 29.077v-7.962a6 6 0 0 0-6-6H9.935a6 6 0 0 0-6 6v7.962',
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
            m('circle', {
              cx: '15.678',
              cy: '8.427',
              r: '6.754',
              'stroke-width': '1.5',
              'stroke-linejoin': 'round',
            }),
          ]
        ),
    ];
  },
};

export const ExternalLinkIcon: m.Component<{
  size?: IconSize;
  disabled?: boolean;
}> = {
  view: (vnode) => {
    return m(
      appendTags('ExternalLinkIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'M5.673 1.273H3.036a2 2 0 0 0-2 2V12a2 2 0 0 0 2 2h8.727a2 2 0 0 0 2-2V9.364m-5.97-8.091h5.97m0 0v5.97m0-5.97L7.399 7.636',
          'stroke-width': '1.5',
          stroke: '#4723AD',
        }),
      ]
    );
  },
};

export const CopyIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('CopyIcon', vnode.attrs),
      {
        width: '29',
        height: '29',
        fill: 'none',
      },
      [
        m('rect', {
          x: '10.4014',
          y: '5.04699',
          width: '11.3635',
          height: '16.1785',
          rx: '3',
          'stroke-width': '1.5',
        }),
        m('rect', {
          x: '6.96094',
          y: '8.42515',
          width: '11.3635',
          height: '16.1785',
          rx: '3',
          'stroke-width': '1.5',
        }),
      ]
    );
  },
};

// export const FilterIcon: m.Component<
//   { size?: IconSize;
//   {}
// > = {
// };

export const NotificationIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size } = vnode.attrs;
    return [
      size === IconSize.MD &&
        m(
          appendTags('NotificationIcon', vnode.attrs),
          {
            width: '21',
            height: '24',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M4.354 8.013V7.96c0-3.576 2.918-6.313 6.412-6.312 3.495 0 6.412 2.737 6.412 6.312v4.193c0 2.577.946 5.065 2.658 6.991h.001v.003H1.695v-.002a10.524 10.524 0 0 0 2.658-6.992v-4.14ZM13.971 19.898a3.205 3.205 0 1 1-6.41 0',
              'stroke-width': '1.5',
            }),
          ]
        ),
      size === IconSize.LG &&
        m(
          appendTags('NotificationIcon', vnode.attrs),
          {
            width: '29',
            height: '29',
            fill: 'none',
          },
          [
            m('path', {
              d: 'M6.813 8.973v-.067c0-4.623 3.773-8.156 8.282-8.156s8.28 3.533 8.28 8.156v5.287c0 3.202 1.176 6.293 3.303 8.686a.198.198 0 0 1-.148.33H3.66a.198.198 0 0 1-.148-.33 13.074 13.074 0 0 0 3.302-8.686v-5.22ZM19.135 23.959a4.041 4.041 0 0 1-8.082 0',
              'stroke-width': '1.5',
            }),
          ]
        ),
    ];
  },
};

export const PinIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('PinIcon', vnode.attrs),
      {
        width: '21',
        height: '21',
        fill: 'none',
      },
      [
        m('rect', {
          width: '10.407',
          height: '13.596',
          rx: '1.02',
          transform: 'scale(-1 1) rotate(-45 -.315 28.471)',
          fill: '#fff',
        }),
        m('path', {
          d: 'm6.93 14.05-5.487 5.486',
          'stroke-linecap': 'round',
        }),
      ]
    );
  },
};

export const XIcon: m.Component<
  {
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('XIcon', vnode.attrs),
      {
        width: '28',
        height: '28',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm6 6 16 16M22 6 6 22',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
        }),
      ]
    );
  },
};

export const SearchIcon: m.Component<
  {
    isMobile?: boolean;
    size?: IconSize;
    intent: IconIntent;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { size } = vnode.attrs;
    return [
      size === IconSize.MD &&
        m(
          appendTags('SearchIcon', vnode.attrs),
          {
            width: '20px',
            height: '20px',
            fill: 'none',
          },
          [
            m('path', {
              'fill-rule': 'evenodd',
              'clip-rule': 'evenodd',
              d: 'M12.9816 7.64497C12.9816 10.9536 10.2994 13.6358 6.9908 13.6358C3.68217 13.6358 1 10.9536 1 7.64497C1 4.33635 3.68217 1.65417 6.9908 1.65417C10.2994 1.65417 12.9816 4.33635 12.9816 7.64497ZM11.5679 12.9292C10.3415 13.9924 8.74129 14.6358 6.9908 14.6358C3.12989 14.6358 0 11.5059 0 7.64497C0 3.78406 3.12989 0.654175 6.9908 0.654175C10.8517 0.654175 13.9816 3.78406 13.9816 7.64497C13.9816 9.39547 13.3382 10.9957 12.275 12.2221L14.5447 14.4917C14.7399 14.687 14.7399 15.0036 14.5447 15.1988C14.3494 15.3941 14.0328 15.3941 13.8376 15.1988L11.5679 12.9292Z',
              // 'fill': 'url(#paint0_linear)',
              fill: vnode.attrs.isMobile ? 'url(#paint0_linear)' : 'black',
              // Long-term, gradient URL fill should be used on desktop as well as mobile;
              // for unclear reasons, currently failing to display on browsers >767.98px
            }),
            m('defs', [
              m(
                'linearGradient',
                {
                  id: 'paint0_linear',
                  x1: '14.6911',
                  y1: '0.938204',
                  x2: '2.18429',
                  y2: '13.6179',
                  gradientUnits: 'userSpaceOnUse',
                },
                [
                  m('stop', { 'stop-color': '#6086D1' }),
                  m('stop', { offset: '1', 'stop-color': '#B37DBA' }),
                ]
              ),
            ]),
          ]
        ),
      size === IconSize.LG &&
        m(
          'svg',
          {
            width: '27',
            height: '26',
            fill: 'none',
            xmlns: 'http://www.w3.org/2000/svg',
          },
          m('path', {
            d: 'M19.586 18.877c4.09-4.09 4.09-10.72 0-14.81s-10.72-4.09-14.81 0-4.09 10.72 0 14.81 10.72 4.09 14.81 0Zm0 0L25.71 25',
            stroke: '#000',
            'stroke-width': '2',
            'stroke-linecap': 'round',
          })
        ),
    ];
  },
};

// SOCIAL ICONS

export const ElementIcon: m.Component<
  {
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('ElementIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'M7 7.5h1m-4 0h1m5 0h1m3.5 7h-7a7 7 0 1 1 7-7v7Z',
          stroke: '#000',
        }),
      ]
    );
  },
};

export const DiscordIcon: m.Component<
  {
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('DiscordIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm11.5 13.5-.326.379a.5.5 0 0 0 .342.12L11.5 13.5Zm-1.066-1.712a.5.5 0 0 0-.785.62l.785-.62Zm.398-.41-.174-.468a.672.672 0 0 0-.02.007l.194.461Zm-1.738.516L9.01 11.4l-.008.001.092.492Zm-3.104-.012-.095.49.003.001.092-.491Zm-1.762-.515-.182.465.182-.466Zm-.875-.408-.278.415a.46.46 0 0 0 .033.021l.245-.436Zm-.108-.06.277-.416a.491.491 0 0 0-.054-.031l-.223.447Zm-.048-.036.353-.354a.502.502 0 0 0-.11-.083l-.243.437Zm2.154 1.52a.5.5 0 0 0-.785-.62l.785.62ZM3.5 13.5l-.016.5a.5.5 0 0 0 .347-.125L3.5 13.5Zm-3-2.253H0a.5.5 0 0 0 .006.08l.494-.08Zm1.726-8.488-.3-.4a.5.5 0 0 0-.168.225l.468.175ZM5.594 1.5l.498-.047A.5.5 0 0 0 5.605 1l-.01.5Zm-.378 1.306a.5.5 0 0 0 .996-.095l-.996.095Zm3.526-.063a.5.5 0 0 0 .992.127l-.992-.127ZM9.406 1.5 9.395 1a.5.5 0 0 0-.485.436l.496.064Zm3.368 1.259.468-.175a.5.5 0 0 0-.168-.225l-.3.4Zm1.726 8.488.494.08a.497.497 0 0 0 .006-.08h-.5ZM6.481 8.8l-.5-.008v.008h.5ZM11.5 13.5l.326-.379-.002-.002a.794.794 0 0 1-.044-.038 21.355 21.355 0 0 1-.536-.48c-.325-.298-.66-.622-.81-.813l-.785.62c.208.264.603.64.918.93a29.109 29.109 0 0 0 .593.53l.01.008.003.002.327-.378Zm.436-3.246c-.46.303-.894.513-1.278.656l.348.937a7.352 7.352 0 0 0 1.48-.758l-.55-.835Zm-1.297.663a7.387 7.387 0 0 1-1.629.484l.168.986a8.39 8.39 0 0 0 1.848-.548l-.387-.922Zm-1.637.485a7.895 7.895 0 0 1-2.92-.012l-.184.983a8.896 8.896 0 0 0 3.288.012l-.184-.983Zm-2.917-.011a9.57 9.57 0 0 1-1.675-.49l-.364.931c.512.2 1.13.402 1.849.54l.19-.981Zm-1.675-.49a6.536 6.536 0 0 1-.813-.378l-.489.872c.326.183.648.324.938.437l.364-.931Zm-.78-.358c-.047-.032-.093-.054-.108-.061-.02-.01-.011-.007 0 .001l-.555.832c.048.032.093.054.108.061.021.01.012.007 0-.002l.556-.83Zm-.162-.091c.02.01.04.022.06.038.017.014.03.026.022.02l-.707.707c.023.023.081.08.178.13l.447-.895Zm-.028-.026a4.697 4.697 0 0 1-.28-.168l-.011-.008a.025.025 0 0 0-.001 0l-.287.41-.286.409.001.001.002.002.007.004.021.014.075.049c.064.04.156.096.273.161l.486-.874Zm1.126 1.338c-.152.193-.489.525-.813.829a30.38 30.38 0 0 1-.538.491l-.034.031-.01.008-.001.002h-.001l.331.375.331.375.001-.001.003-.002.01-.009.036-.032a38.039 38.039 0 0 0 .555-.508c.315-.296.708-.677.915-.94l-.785-.62ZM3.516 13c-1.166-.037-1.778-.521-2.11-.96a2.394 2.394 0 0 1-.4-.82 1.1 1.1 0 0 1-.013-.056v.002l-.493.08c-.494.08-.494.08-.493.081v.006a1.367 1.367 0 0 0 .028.127 3.394 3.394 0 0 0 .573 1.183c.505.667 1.393 1.31 2.876 1.357l.032-1ZM1 11.247c0-1.867.42-3.94.847-5.564a35.45 35.45 0 0 1 .776-2.552 16.43 16.43 0 0 1 .067-.186l.004-.01v-.001l-.468-.175-.469-.175v.001l-.001.003-.004.011a9.393 9.393 0 0 0-.072.2 36.445 36.445 0 0 0-.8 2.629C.443 7.083 0 9.253 0 11.247h1Zm1.526-8.088c.8-.6 1.577-.89 2.15-1.03a4.764 4.764 0 0 1 .86-.128A1.48 1.48 0 0 1 5.585 2h-.001l.01-.5.01-.5H5.6a.848.848 0 0 0-.028 0L5.504 1a3.973 3.973 0 0 0-.24.016 5.763 5.763 0 0 0-.825.141 6.938 6.938 0 0 0-2.513 1.2l.6.8Zm2.57-1.612.12 1.259.996-.095-.12-1.258-.996.094ZM9.734 2.87l.168-1.306-.992-.128-.168 1.307.992.127ZM9.406 1.5l.01.5h-.001a.497.497 0 0 1 .049 0c.038.002.1.005.179.013.16.014.394.047.681.117.573.14 1.35.429 2.15 1.029l.6-.8a6.937 6.937 0 0 0-2.513-1.2 5.76 5.76 0 0 0-.825-.142A3.98 3.98 0 0 0 9.399 1h-.003l.01.5Zm3.368 1.259-.469.174.001.003.004.009.013.037.053.149a35.482 35.482 0 0 1 .777 2.552c.428 1.624.847 3.697.847 5.564h1c0-1.994-.444-4.164-.88-5.819a36.512 36.512 0 0 0-.8-2.629 15.246 15.246 0 0 0-.057-.158l-.015-.042-.004-.01-.001-.004-.47.174Zm1.726 8.488-.493-.08v-.003l-.002.008-.01.047c-.012.045-.03.113-.061.197-.062.17-.167.396-.34.624-.332.439-.944.923-2.11.96l.032 1c1.483-.047 2.37-.69 2.876-1.356a3.395 3.395 0 0 0 .573-1.184 2.05 2.05 0 0 0 .026-.118l.002-.01v-.004c0-.001 0-.002-.493-.081ZM5.259 6.97c-1.002 0-1.723.867-1.723 1.83h1c0-.498.357-.83.723-.83v-1ZM3.536 8.8c0 .967.736 1.83 1.723 1.83v-1c-.357 0-.723-.334-.723-.83h-1Zm1.723 1.83c1 0 1.722-.866 1.722-1.83h-1c0 .5-.357.83-.722.83v1ZM6.98 8.81c.016-.978-.728-1.84-1.722-1.84v1.001c.372 0 .73.338.722.822l1 .017Zm2.653-1.84c-1.002.001-1.723.868-1.723 1.831h1c0-.498.357-.83.723-.83v-1ZM7.91 8.802c0 .967.736 1.83 1.723 1.83v-1c-.357 0-.723-.334-.723-.83h-1Zm1.723 1.83c1 0 1.722-.866 1.722-1.83h-1c0 .5-.357.83-.722.83v1Zm1.722-1.83c0-.963-.721-1.83-1.722-1.83v1c.365 0 .722.332.722.83h1ZM3.74 4.44c1.443-.787 2.619-1.154 3.763-1.155 1.145 0 2.318.365 3.758 1.154l.48-.876c-1.522-.835-2.865-1.279-4.238-1.278-1.373 0-2.717.445-4.241 1.277l.478.878Z',
          fill: '#000',
        }),
      ]
    );
  },
};

export const TelegramIcon: m.Component<
  {
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('TelegramIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm14.5 1.5-14 5 4 2 6-4-4 5 6 4 2-12Z',
          'stroke-linejoin': 'round',
          stroke: '#000',
        }),
      ]
    );
  },
};

export const GithubIcon: m.Component<
  {
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('GithubIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'M5.65 12.477a.5.5 0 1 0-.3-.954l.3.954Zm-3.648-2.96-.484-.128-.254.968.484.127.254-.968ZM9 14.5v.5h1v-.5H9Zm.063-4.813-.054-.497a.5.5 0 0 0-.299.852l.352-.354ZM12.5 5.913h.5V5.91l-.5.002Zm-.833-2.007-.466-.18a.5.5 0 0 0 .112.533l.354-.353Zm-.05-2.017.456-.204a.5.5 0 0 0-.319-.276l-.137.48Zm-2.173.792-.126.484a.5.5 0 0 0 .398-.064l-.272-.42Zm-3.888 0-.272.42a.5.5 0 0 0 .398.064l-.126-.484ZM3.383 1.89l-.137-.48a.5.5 0 0 0-.32.276l.457.204Zm-.05 2.017.354.353a.5.5 0 0 0 .112-.534l-.466.181ZM2.5 5.93H3v-.002l-.5.002Zm3.438 3.758.352.355a.5.5 0 0 0-.293-.851l-.06.496ZM5.5 11H6l-.001-.037L5.5 11ZM5 14.5v.5h1v-.5H5Zm.35-2.977c-.603.19-.986.169-1.24.085-.251-.083-.444-.25-.629-.49a4.8 4.8 0 0 1-.27-.402c-.085-.139-.182-.302-.28-.447-.191-.281-.473-.633-.929-.753l-.254.968c.08.02.184.095.355.346.082.122.16.252.258.412.094.152.202.32.327.484.253.33.598.663 1.11.832.51.168 1.116.15 1.852-.081l-.3-.954Zm4.65-.585c0-.318-.014-.608-.104-.878-.096-.288-.262-.51-.481-.727l-.705.71c.155.153.208.245.237.333.035.105.053.254.053.562h1Zm-.884-.753c.903-.097 1.888-.325 2.647-.982.78-.675 1.237-1.729 1.237-3.29h-1c0 1.359-.39 2.1-.892 2.534-.524.454-1.258.653-2.099.743l.107.995ZM13 5.91a3.354 3.354 0 0 0-.98-2.358l-.707.706c.438.44.685 1.034.687 1.655l1-.003Zm-.867-1.824c.15-.384.22-.794.21-1.207l-1 .025a2.12 2.12 0 0 1-.142.82l.932.362Zm.21-1.207a3.119 3.119 0 0 0-.27-1.195l-.913.408c.115.256.177.532.184.812l1-.025Zm-.726-.99c.137-.481.137-.482.136-.482h-.003l-.004-.002a.462.462 0 0 0-.03-.007 1.261 1.261 0 0 0-.212-.024 2.172 2.172 0 0 0-.51.054c-.425.091-1.024.317-1.82.832l.542.84c.719-.464 1.206-.634 1.488-.694.14-.03.23-.033.273-.032.022 0 .033.002.033.002l-.008-.001a.278.278 0 0 1-.01-.002l-.006-.002h-.003l-.002-.001c-.001 0-.002 0 .136-.482Zm-2.047.307a8.209 8.209 0 0 0-4.14 0l.252.968a7.209 7.209 0 0 1 3.636 0l.252-.968Zm-3.743.064C5.03 1.746 4.43 1.52 4.005 1.43a2.17 2.17 0 0 0-.51-.053 1.259 1.259 0 0 0-.241.03l-.004.002h-.003l.136.481.137.481h-.001l-.002.001-.003.001a.327.327 0 0 1-.016.004l-.008.001h.008a1.19 1.19 0 0 1 .298.03c.282.06.769.23 1.488.694l.543-.84Zm-2.9-.576a3.12 3.12 0 0 0-.27 1.195l1 .025c.006-.28.068-.556.183-.812l-.913-.408Zm-.27 1.195c-.01.413.06.823.21 1.207l.932-.362a2.12 2.12 0 0 1-.143-.82l-1-.025Zm.322.673a3.354 3.354 0 0 0-.726 1.091l.924.38c.118-.285.292-.545.51-.765l-.708-.706Zm-.726 1.091A3.354 3.354 0 0 0 2 5.93l1-.003c0-.31.06-.616.177-.902l-.924-.38ZM2 5.93c0 1.553.458 2.597 1.239 3.268.757.65 1.74.88 2.64.987l.118-.993C5.15 9.09 4.416 8.89 3.89 8.438 3.388 8.007 3 7.276 3 5.928H2Zm3.585 3.404c-.5.498-.629 1.09-.584 1.704L6 10.963c-.03-.408.052-.683.291-.921l-.705-.709ZM5 11v3.5h1V11H5Zm5 3.5V13H9v1.5h1Zm0-1.5v-2.063H9V13h1Z',
          fill: '#000',
        }),
      ]
    );
  },
};

export const WebsiteIcon: m.Component<
  {
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    return m(
      appendTags('WebsiteIcon', vnode.attrs),
      {
        width: '15',
        height: '15',
        fill: 'none',
      },
      [
        m('path', {
          d: 'M4.5 5.5V5a.5.5 0 0 0-.5.5h.5Zm0 1 .354.354L5 6.707V6.5h-.5Zm-1.707.293-.354.353.354-.353ZM6.5 13H7v-.207l-.146-.147L6.5 13Zm-1-1H5v.207l.146.147L5.5 12Zm0-1.5H6v-.207l-.146-.147-.354.354Zm-1-1H4v.207l.146.147L4.5 9.5Zm0-1V8a.5.5 0 0 0-.5.5h.5ZM9 .5v2h1v-2H9ZM8.5 3h-1v1h1V3Zm-3 2h-1v1h1V5ZM4 5.5v1h1v-1H4Zm.146.646-.292.293.707.707.293-.292-.708-.708Zm-1 .293L1.354 4.646l-.708.708L2.44 7.146l.707-.707ZM6 4.5a.5.5 0 0 1-.5.5v1A1.5 1.5 0 0 0 7 4.5H6ZM7.5 3A1.5 1.5 0 0 0 6 4.5h1a.5.5 0 0 1 .5-.5V3ZM3.854 6.44a.5.5 0 0 1-.708 0l-.707.706a1.5 1.5 0 0 0 2.122 0l-.707-.707ZM9 2.5a.5.5 0 0 1-.5.5v1A1.5 1.5 0 0 0 10 2.5H9Zm-2 12V13H6v1.5h1Zm-.146-1.854-1-1-.708.708 1 1 .708-.708ZM6 12v-1.5H5V12h1Zm-.146-1.854-1-1-.708.708 1 1 .708-.708ZM5 9.5v-1H4v1h1ZM4.5 9h4V8h-4v1Zm4.5.5v.667h1V9.5H9Zm1.833 2.5H13.5v-1h-2.667v1ZM10 11.167c0 .46.373.833.833.833v-1c.092 0 .167.075.167.167h-1ZM9.833 11c.092 0 .167.075.167.167h1C11 10.522 10.478 10 9.833 10v1ZM9 10.167c0 .46.373.833.833.833v-1c.092 0 .167.075.167.167H9ZM8.5 9a.5.5 0 0 1 .5.5h1A1.5 1.5 0 0 0 8.5 8v1Zm-1 5A6.5 6.5 0 0 1 1 7.5H0A7.5 7.5 0 0 0 7.5 15v-1ZM14 7.5A6.5 6.5 0 0 1 7.5 14v1A7.5 7.5 0 0 0 15 7.5h-1ZM7.5 1A6.5 6.5 0 0 1 14 7.5h1A7.5 7.5 0 0 0 7.5 0v1Zm0-1A7.5 7.5 0 0 0 0 7.5h1A6.5 6.5 0 0 1 7.5 1V0Z',
          fill: '#000',
        }),
      ]
    );
  },
};
