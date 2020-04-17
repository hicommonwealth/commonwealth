import m from 'mithril';
import { TextInputFormField } from './forms';

export interface IAutoCompleteFormAttrs {
  results: any[];
  title?: string;
  placeholder: string;
  applyDefaultHandler?: boolean;
  onChangeHandler?: Function;
  rowComponentFunc?: (arg) => m.Vnode;
  tabindex: number;
}

export interface IAutoCompleteFormState {
  filteredResults: any[];
}

/**
 * A pure component that presents an input and a list of results
 * provided by the parent component. When the input changes, the
 * parent component passes in new results to this pure component.
 *
 * Example Usage with naive includes autocomplete:
 *
 * m(AutoCompletePureForm, {
 *   title: 'hi',
 *   placeholder: 'hi',
 *   results: vnode.state.results || [],
 *   onChangeHandler: (result) => {
 *     const coll = ['aaaaa', 'aaab', 'aaaaaaa', 'aaabbb', 'cde', 'cd', 'c'];
 *     vnode.state.results = coll.filter(c => {
 *       return c.indexOf(result) !== -1;
 *     });
 *     m.redraw();
 *   }
 * }),
 */
export const AutoCompletePureForm: m.Component<IAutoCompleteFormAttrs> = {
  view: (vnode) => {
    const { results } = vnode.attrs;
    return m('.AutoCompletePureForm', [
      m('.autocomplete-wrap', [
        m(TextInputFormField, {
          title: vnode.attrs.title,
          options: {
            class: 'autocomplete-entry',
            placeholder: vnode.attrs.placeholder,
            tabindex: vnode.attrs.tabindex,
          },
          callback: vnode.attrs.onChangeHandler,
        }),
      ]),
      m('.results', [
        results.map(vnode.attrs.rowComponentFunc),
      ]),
    ]);
  },
};

/**
 * A parent component for the AutoCompletePureForm that has a default
 * onChangeHandler. A custom onChangeHandler can still be passed in.
 * In this parent component, state is maintained to track the current
 * set of filtered results to pass into the AutoCompletePureForm.
 *
 * Example Usage with of the parent component that defaults to naive autocomplete:
 *
 * m(AutoCompleteForm, {
 *   title: 'hi',
 *   placeholder: 'hi',
 *   results: vnode.state.results || [],
 * }),
 */
export const AutoCompleteForm: m.Component<IAutoCompleteFormAttrs, IAutoCompleteFormState> = {
  view: (vnode) => m(AutoCompletePureForm, {
    title: vnode.attrs.title,
    placeholder: vnode.attrs.placeholder,
    results: vnode.state.filteredResults || [],
    onChangeHandler: (result) => {
      // pass in a change handler that does a modified autocomplete
      if (vnode.attrs.onChangeHandler) vnode.state.filteredResults = vnode.attrs.onChangeHandler(result) || [];
      // or default to a simple autocomplete that simply checks substring inclusion
      else vnode.state.filteredResults = vnode.attrs.results.filter((c) => (c.indexOf(result) !== -1));
      // return vnode.state.filteredResults;
      const resultsEle = (document.getElementsByClassName('results')[0] as HTMLInputElement);
      const autoWrap = (document.getElementsByClassName('autocomplete-wrap')[0] as HTMLInputElement);
      if (vnode.state.filteredResults.length) {
        resultsEle.classList.add('show');
        autoWrap.classList.add('displaying-results');
      } else {
        resultsEle.classList.remove('show');
        autoWrap.classList.remove('displaying-results');
      }
      m.redraw();
    },
    rowComponentFunc: (rowData) => ((vnode.attrs.rowComponentFunc)
    // use passed down row component creation function for autocompleted options
      ? vnode.attrs.rowComponentFunc(rowData)
    // default to simple 'p' tag
      : m('p', rowData)),
    tabindex: vnode.attrs.tabindex
  }),
};

export default AutoCompleteForm;
