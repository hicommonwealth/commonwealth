import m from 'mithril';
import { Example, SizeSelect } from '../../../_shared/examples';
import { CustomSelect, Size } from '../../index';

const EXAMPLE_SRC = 'components/custom-select/examples/index.ts';
const options = [
  {
    label: 'First',
    value: '1'
  },
  {
    label: 'Second',
    value: '2',
    disabled: true
  },
  {
    label: 'Third',
    value: '3'
  },
  {
    label: 'Fourth',
    value: '4'
  }
];

export class CustomSelectExample {
  private size: Size;

  public view() {
    return m(Example, { options: this.renderOptions(), src: EXAMPLE_SRC }, [
      m(CustomSelect, {
        defaultValue: '3',
        options,
        size: this.size
      })
    ]);
  }

  private renderOptions() {
    return [
      m('h5', 'Size'),
      m(SizeSelect, { onSelect: (size: Size) => this.size = size })
    ];
  }
}
