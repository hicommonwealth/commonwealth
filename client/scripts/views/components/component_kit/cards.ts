import m from 'mithril';
import 'components/component_kit/cards.scss';

export interface CardAttrs {
    /** Degree of card shadow (Range 1-3) */
    elevation?: number 
    /** Fills width of parent container */
    fluid?: boolean;
    /** Custom styles */
    class_name?: string;
    /** Adds interactive hover/active styling */
    interactive?: boolean;
    onclick?: Function;
    onmouseover?: Function;
    onmouseenter?: Function;
    onmouseleave?: Function
}

const appendTags = (base: string, attrs: CardAttrs) => {
    const {elevation, fluid, class_name, interactive} = attrs;
    let tag = base;
    if (elevation > 0 && elevation < 4) tag += `.elevation-${elevation}`;
    if (interactive) tag += '.interactive';
    if (!fluid && fluid === false) tag += '.not-fluid';
    if (class_name) tag += class_name;
    
    return tag;
}

export const FaceliftCard: m.Component<CardAttrs,{}> = {
    view: (vnode) => {
        const  {onclick, onmouseover, onmouseenter, onmouseleave} = vnode.attrs;
        return m(appendTags('.Card', vnode.attrs), {onclick, onmouseover, onmouseenter, onmouseleave}, [
            vnode.children
        ]);
    }
}
