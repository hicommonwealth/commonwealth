import m from 'mithril';


export interface SubSectionProps {
    title: string;
    onclick: Function;
    onhover?: Function;
}

export interface SectionGroupProps {
    title: string;
    contains_children: boolean;
    default_active: boolean;
    is_active: true;
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


const SidebarSection: m.Component<SidebarSectionProps, {}> = {
    view: (vnode) => {

    }
};

export default SidebarSection;