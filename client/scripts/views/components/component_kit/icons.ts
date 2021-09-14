import m from 'mithril';

export enum IconStates {
  Default = 'default',
  Hover = 'hover',

}

export enum IconColors {
  Black = '#000000',
  DarkGray = '#333333',
  MidiGray = '#666666',
  LiteGray = '#999999',
  DisableGray = '#DDDDDD',
}

export const ArrowDown: m.Component<{ iconState: IconStates, color?: string, size?: number; }, { color: string }> = {
  view: (vnode) => {
    let stateColor;
    switch (vnode.attrs.iconState) {
      case (IconStates.Default): stateColor = IconColors.LiteGray;
      case (IconStates.Hover): stateColor = IconColors.Black;
    }
    return m('svg', {
      'width': `${vnode.attrs.size || 14}`, //15
      'height': `${vnode.attrs.size || 14}`, //16
      'fill':'none',
      'xmlns':'http://www.w3.org/2000/svg'
    },
      m('path', {
        'd':'m14.036 3.671-6.464 7.66-6.465-7.66',
        'stroke': vnode.attrs.color || stateColor,
        'stroke-width':'2',
        'stroke-linecap':'round'
      })
    );
  }
}

export const ArrowRight: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
  view: (vnode) => {
    let stateColor;
    switch (vnode.attrs.iconState) {
      case (IconStates.Default): stateColor = IconColors.LiteGray;
      case (IconStates.Hover): stateColor = IconColors.Black;
    }
    return m('svg', {
      'width': `${vnode.attrs.size || 14}`, //15
      'height': `${vnode.attrs.size || 14}`, //15
      'fill':'none',
      'xmlns':'http://www.w3.org/2000/svg'
    }, 
      m('path', {
        'd':'m4.027 1.036 7.658 6.465-7.658 6.464',
        'stroke': vnode.attrs.color || stateColor,
        'stroke-width':'2',
        'stroke-linecap':'round'
      })
  );
  }
}

export const Likes: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
  view: (vnode) => {
    let stateColor;
    switch (vnode.attrs.iconState) {
      case (IconStates.Default): stateColor = IconColors.MidiGray;
    }
    return m('svg', {
      'width':'20',
      'height':'17',
      'fill':'none',
      'xmlns':'http://www.w3.org/2000/svg'
    }, 
      m('path', {
        'd':'M10.887 15.088a1 1 0 0 1-1.393 0L4.077 9.826l-.738-.717a4.668 4.668 0 0 1-1.425-3.348c0-1.262.516-2.466 1.425-3.349A4.888 4.888 0 0 1 6.744 1.04c1.272 0 2.498.49 3.405 1.372l.042.04.04-.04h.001c.45-.437.982-.782 1.566-1.017a4.927 4.927 0 0 1 3.678 0 4.84 4.84 0 0 1 1.566 1.017l-6.155 12.676Zm0 0 5.417-5.262m-5.416 5.262 5.416-5.262m0 0 .738-.717m-.738.717.738-.717m0 0s0 0 0 0m0 0h0m0 0c.45-.437.809-.957 1.054-1.532M17.042 9.11l1.054-1.532m0 0a4.628 4.628 0 0 0 .372-1.816m-.372 1.816.372-1.816m0 0c0-.624-.127-1.242-.372-1.817m.372 1.817-.372-1.817m0 0a4.715 4.715 0 0 0-1.053-1.531l1.053 1.531Z',
        'stroke':'#666',
        'stroke-width':'2',
        'stroke-linecap':'round',
        'stroke-linejoin':'round'})
    );
  }
}

export const Replies: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
  view: (vnode) => {
    switch (vnode.attrs.iconState) {
      case (IconStates.Default): vnode.attrs.color = IconColors.MidiGray;
    }
      return m('svg', {
      'width': `${vnode.attrs.size || 14}`, //'17',
      'height': `${vnode.attrs.size || 14}`, // '17',
      'fill':'none',
      'xmlns':'http://www.w3.org/2000/svg'},

      m('path',
       {'d':'M1.858 14.322a1 1 0 0 0 1.73.684l2.243-2.393h7.185c.624 0 1.208-.265 1.628-.713a2.402 2.402 0 0 0 .642-1.641V3.487c0-.605-.224-1.196-.642-1.642a2.231 2.231 0 0 0-1.628-.713H4.128a2.23 2.23 0 0 0-1.627.713 2.401 2.401 0 0 0-.643 1.642v10.835Z',
      'stroke': vnode.attrs.color,
      'stroke-width':'2',
      'stroke-linecap':'round',
      'stroke-linejoin':'round'})
    );
  }
}

export const Views: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
      switch (vnode.attrs.iconState) {
        case (IconStates.Default): vnode.attrs.color = IconColors.MidiGray;
        }
        return 
    }
}

export const Discuss: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Like: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Reply: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Share: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Subscribe: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Account: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Copy: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Create: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Filter: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Notification: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const Search: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

export const X: m.Component<{ iconState: IconStates, color?: string, size?: number; }, {}> = {
    view: (vnode) => {
        return 
    }
}

