import { Icon, Icons } from 'construct-ui';
import { isValueNode } from 'graphql';
import m from 'mithril';
import { ConsoleLoggerImpl } from 'typescript-logging';


export interface SubSectionProps {
    title: string;
    is_visible: boolean;
    is_active: boolean; // Is this the current page
    is_updated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
    onclick: Function;
    onhover?: Function;
    row_icon?: boolean;
}

export interface SectionGroupProps {
    title: string;
    contains_children: boolean;
    default_toggle: boolean;
    is_visible: boolean; // Is this section shown as an option
    is_active: boolean; // Is this the current page
    is_updated: boolean; // Does this page have updates (relevant for chat, less so for other sections)
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
    toggle_disabled?: boolean;
}

const SubSection: m.Component<SubSectionProps, {background_color: string}> = {
    oninit: (vnode) => {
        vnode.state.background_color = vnode.attrs.is_active ? '#EDE7FF' : 'none';
    },
    view: (vnode) => {
        const {title, is_visible, is_active, onclick, row_icon, is_updated} = vnode.attrs;
        const { background_color } = vnode.state;
        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            onclick(e);
        }

        let title_text_class = '.title-standard';
        if (is_active) {
            title_text_class = '.title-active'
        } else if (!is_updated) {
            title_text_class = '.title-stale'
        }

        const mouse_enter_handler = (e) => {
            vnode.state.background_color = '#EDE7FF';
        }

        const mouse_leave_handler = (e) => {
            vnode.state.background_color = (is_active) ? '#EDE7FF' : 'none';
        }

        return m('.SubSection',{
            onclick: (e) => click_handler(e),
            style: `background-color: ${background_color}`,
            onmouseenter: (e) => mouse_enter_handler(e),
            onmouseleave: (e) => mouse_leave_handler(e),
        }, [
            row_icon && m(title_text_class, [m(Icon, {name: Icons.HASH})]),
            m(title_text_class, title),
        ])
    }
}

const SectionGroup: m.Component<SectionGroupProps, {toggled: boolean, hover_on: boolean}> = {
    oninit: (vnode) => {
        vnode.state.toggled = vnode.attrs.default_toggle;
    },
    view: (vnode) => {
        const {title, contains_children, display_data, is_visible, is_updated, is_active, onclick, onhover} = vnode.attrs;
        const {toggled} = vnode.state;

        if (!is_visible) {
            return;
        }

        const click_handler = (e) => {
            if (contains_children) {
                vnode.state.toggled = !toggled;
            }
            onclick(e, vnode.state.toggled);
        }

        const carat = toggled ? m(Icon, {
                name: Icons.CHEVRON_DOWN,
            }) : m(Icon, {
                name: Icons.CHEVRON_RIGHT,
            });

        let title_text_class = '.section-title-text-standard';
        if (is_active && !contains_children) {
            title_text_class = '.section-title-text-active'
        } else if (!is_updated) {
            title_text_class = '.section-title-text-stale'
        }

        let background_color = 'none';
        if (is_active && !contains_children) {
            background_color = '#EDE7FF'
        }

        const mouse_enter_handler = (e) => {
            if (!toggled) {
                background_color = '#EDE7FF';
                vnode.state.hover_on = true;
            }   
        }

        const mouse_leave_handler = (e) => {
            background_color = (is_active && !contains_children) ? '#EDE7FF' : 'none';
            vnode.state.hover_on = false;
        }
        
        return m('.SectionGroup', {
            onmouseenter: (e) => mouse_enter_handler(e),
            onmouseleave: (e) => mouse_leave_handler(e),
        },[
            m('.SectionGroupTitle', {
                onclick: (e) => click_handler(e),
                style: `background-color: ${vnode.state.hover_on ? '#EDE7FF' : background_color}`,
            }, [
                contains_children ? m('.carat', carat) : m('.no-carat'),
                m(title_text_class, title), 
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

        const {title, onclick, toggle_disabled, display_data} = vnode.attrs;
        const {toggled, hover_color} = vnode.state;

        const click_handler = (e) => {
            if (toggle_disabled) {
                return;
            }
            vnode.state.toggled = !toggled;
            if (vnode.state.toggled) {
                vnode.state.hover_color = 'none';
            }
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
                m('.toggle-icon', carat)
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