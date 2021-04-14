import m from 'mithril';
import app from 'state';
import { InputSelect } from 'construct-ui';

var items = [];
var searchValue =  ""
const Search : m.Component<{ }> = {
  oninit: async () => {
    items = await app.tokens.getTokensFromLists();
  },
  view: (vnode) => {
    return m('.Search', [
      m(InputSelect, {
        value: searchValue,
        items,
        itemRender: (item : any, index) => {
          return m("div", [ 
            m('img', {
              src: item.logoURI,
              height: "15px",
              width: "15px"
            }),
            m("span", item.name)
          ])
        },
        itemListPredicate: (query, items) => {
          items = items.filter((item : any)=>{
            return item.name.toLowerCase().includes(query) || 
            item.symbol.toLowerCase().includes(query)
          })
          return items
        }, 
        onSelect: (item : any) => {
          searchValue = item.name
          window.location.href = "/"+item.address
        },
        inputAttrs: {
          defaultValue: "Search for ERC20 token (name, address, ticker symbol)",
          onkeydown: (key) => {
            // enter key
            if(key.keyCode == 13) {
              window.location.href = key.target.value;
            }
          }
        }
      }),
    ]);
  }
};

export default Search;
