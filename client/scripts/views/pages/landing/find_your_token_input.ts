import m from 'mithril';


const FindYourTokenInputComponent: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('input', {
      class:
        'p-2 flex-grow mr-2 text-xl text-gray-400 pt-3.5 focus:outline-none',
      id: 'token-input',
      type: 'text',
      placeholder: 'Find your favorite token',
      onchange: (e) => {
        console.log(e.target.value);
      },
      oninput: (e) => {
        console.log(e.target.value);
      },
    });
  },
};

export default FindYourTokenInputComponent;
