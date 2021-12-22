import m from 'mithril';
import 'components/component_kit/cards.scss';
import { FunctionList } from 'aws-sdk/clients/lambda';



const appendTags = (base: string, attrs) => {
    const {elevation, fluid, interactive} = attrs;
    let tag = base;
    if (elevation > 0 && elevation < 6) tag += `.elevation-${elevation}`;
    if (interactive) tag += '.interactive';
    
    return tag;
}

export const FaceliftCard: m.Component<
    {
        /** Degree of card shadow (1-4) */
        elevation?: number 
        /** Adds interactive hover/active styling */
        interactive?: boolean;
        onclick?: Function;
        onmouseover?: Function;
        onmouseenter?: Function;
        onmouseleave?: Function
    },
    {}
> = {
    view: (vnode) => {
        const  {onclick, onmouseover, onmouseenter, onmouseleave} = vnode.attrs;
        return m(appendTags('.Card', vnode.attrs), {onclick, onmouseover, onmouseenter, onmouseleave}, [
            vnode.children
        ]);
    }
}
