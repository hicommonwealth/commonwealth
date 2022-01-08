import { Icon, Icons } from 'construct-ui';
import { isValueNode } from 'graphql';
import m from 'mithril';


export interface SubSectionProps {
    title: string;
    is_visible: boolean;
    onclick: Function;
    is_active: boolean;
    onhover?: Function;
    row_icon?: string;
}

export interface SectionGroupProps {
    title: string;
    contains_children: boolean;
    default_active: boolean;
    is_visible: boolean;
    is_active: boolean;
    onclick: Function;
    onhover?: Function;
    display_data: SubSectionProps[] | null;
}

export interface SidebarSectionProps {
    title: string;
    default_active: boolean;
    is_active: boolean;
    onclick: Function;
    onhover?: Function;
    display_data: SectionGroupProps[];
}

const SubSection: m.Component<SubSectionProps, {is_active: boolean}> = {
    view: (vnode) => {

        const {title, is_visible, is_active, onclick} = vnode.attrs;

        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            onclick();
            //
        }

        return m('.SubSection',{onclick: (e) => click_handler(e)}, [
            m('.row-icon', []),
            m('.row-title', title),
        ])
    }
}

const SectionGroup: m.Component<SectionGroupProps, {toggled: boolean}> = {
    oninit: (vnode) => {
        vnode.state.toggled = vnode.attrs.default_active;
    },
    view: (vnode) => {

        const {title, contains_children, display_data, is_visible, onclick, onhover} = vnode.attrs;
        const {toggled} = vnode.state;

        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            onclick();
            vnode.state.toggled = !toggled;
        }

        
        const carat = toggled ? m(Icon, {
                name: Icons.CHEVRON_DOWN,
            }) : m(Icon, {
                name: Icons.CHEVRON_RIGHT,
            });

        return m('.SectionGroup', [
            m('.SectionGroupTitle', {onclick: (e) => click_handler(e)}, [
                contains_children ? m('.carat', carat) : m('.no-carat'),
                m('.section-title-text', title),
            ]),
            toggled && m('.subsections', [
                display_data.map((subsection) => (
                    m(SubSection, {...subsection})
                ))
            ])
        ])
        
    }
}


const SidebarSection: m.Component<SidebarSectionProps, {toggled: boolean, hover_color: string}> = {
    oninit: (vnode) => {
        vnode.state.toggled = vnode.attrs.default_active;
        vnode.state.hover_color = 'none';
    },
    view: (vnode) => {

        const {title, onclick, onhover, display_data} = vnode.attrs;
        const {toggled, hover_color} = vnode.state;

        const click_handler = (e) => {
            onclick();
            //
            vnode.state.toggled = !toggled;
        }

        const mouse_enter_handler = (e) => {
            if (!toggled) {
                vnode.state.hover_color = 'violet';
            } 
        }

        const mouse_leave_handler = (e) => {
            vnode.state.hover_color = 'none';
        }
        
        return m('.SidebarSection', {}, [
            m('.SidebarTitle', {
                onclick: (e) => click_handler(e), 
                onmouseenter: (e) => mouse_enter_handler(e),
                onmouseleave: (e) => mouse_leave_handler(e),
                style: `background-color: ${hover_color}`
            }, [
                m('.title-text', title),
                m('.visibility-icon', [])
            ]),
            toggled && m('.section-groups', [
                display_data.map((section_group) => (
                    m(SectionGroup, {...section_group})
                ))
            ])
        ])
    }
};



export default SidebarSection;