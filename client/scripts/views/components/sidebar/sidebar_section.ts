import { Icon, Icons } from 'construct-ui';
import { isValueNode } from 'graphql';
import m from 'mithril';
import { ConsoleLoggerImpl } from 'typescript-logging';


export interface SubSectionProps {
    title: string;
    is_visible: boolean;
    onclick: Function;
    is_active: boolean;
    onhover?: Function;
    row_icon?: boolean;
}

export interface SectionGroupProps {
    title: string;
    contains_children: boolean;
    default_toggle: boolean;
    is_visible: boolean;
    is_active: boolean;
    onclick: Function;
    onhover?: Function;
    display_data: SubSectionProps[] | null;
}

export interface SidebarSectionProps {
    title: string;
    default_toggle: boolean;
    is_active: boolean;
    onclick: Function;
    onhover?: Function;
    display_data: SectionGroupProps[];
}

const SubSection: m.Component<SubSectionProps, {text_color: string}> = {
    view: (vnode) => {
        const {title, is_visible, is_active, onclick, row_icon} = vnode.attrs;
        const { text_color } = vnode.state;
        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            onclick(e);
            console.log(e);
            //
        }


        return m('.SubSection',{
            onclick: (e) => click_handler(e),
        }, [
            row_icon && m(is_active ? '.row-icon-active' : '.row-icon-inactive', [m(Icon, {name: Icons.HASH})]),
            m(is_active ? '.row-title-active' : '.row-title-inactive', title),
        ])
    }
}

const SectionGroup: m.Component<SectionGroupProps, {toggled: boolean}> = {
    oninit: (vnode) => {
        vnode.state.toggled = vnode.attrs.default_toggle;
    },
    view: (vnode) => {

        const {title, contains_children, display_data, is_visible, onclick, onhover} = vnode.attrs;
        const {toggled} = vnode.state;

        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            vnode.state.toggled = !toggled;
            onclick(e, vnode.state.toggled);
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
            contains_children && toggled && m('.subsections', [
                display_data.map((subsection) => (
                    m(SubSection, {...subsection})
                ))
            ])
        ])
        
    }
}


const SidebarSection: m.Component<SidebarSectionProps, {toggled: boolean, hover_color: string}> = {
    oninit: (vnode) => {
        vnode.state.toggled = vnode.attrs.default_toggle;
        vnode.state.hover_color = 'none';
    },
    view: (vnode) => {

        const {title, onclick, onhover, display_data} = vnode.attrs;
        const {toggled, hover_color} = vnode.state;

        const click_handler = (e) => {
            vnode.state.toggled = !toggled;
            onclick(e, vnode.state.toggled);
        }

        const mouse_enter_handler = (e) => {
            if (!toggled) {
                vnode.state.hover_color = '#EDE7FF';
            }   
        }

        const mouse_leave_handler = (e) => {
            vnode.state.hover_color = 'none';
        }

        const carat = toggled ? m(Icon, {
            name: Icons.CHEVRON_DOWN,
        }) : m(Icon, {
            name: Icons.CHEVRON_RIGHT,
        });
        
        return m('.SidebarSection', { 
            onmouseenter: (e) => mouse_enter_handler(e),
            onmouseleave: (e) => mouse_leave_handler(e),
            style: `background-color: ${hover_color}`
        }, [
            m('.SidebarTitle', {
                onclick: (e) => click_handler(e), 
            }, [
                m('.title-text', title),
                m('.visibility-icon', carat)
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