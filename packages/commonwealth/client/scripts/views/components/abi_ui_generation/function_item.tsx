// import m from 'mithril';
// import $ from 'jquery';

// type FunctionItemAttrs = {
//   fn: any;
//   isActive: boolean;
// }

// export class FunctionItem implements m.ClassComponent<FunctionItemAttrs> {
// //   const arity = fn.inputs?.length || 0;
// //   const label = `${fn.name}(${arity})`;

// //   // ensure an active item is always in view
// //   const ref = React.createRef<HTMLDivElement>();
// //   useEffect(() => {
// //     if (isActive) {
// //       ref.current.scrollIntoView({ block: "nearest" });
// //     }
// //   }, [isActive]);

//     oninit(vnode) {
//         return null;
//     }

//     view(vnode) {
//         return (
//             <Item
//             isActive={isActive}
//             onClick={onClick}
//             className="function-list-item"
//             title={label}
//             ref={ref}
//             >
//             {label}
//             </Item>
//         );
//     }
// };