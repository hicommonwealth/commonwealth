import m from 'mithril';
import $ from 'jquery';

import { ContractAttrs, FunctionInfoState } from 'views/pages/create_community/types';
import FunctionDetails from "./FunctionDetails";
import FunctionList from "./FunctionList";
import FunctionCall from "../function-call/FunctionCall";

export class FunctionInfo implements m.ClassComponent<ContractAttrs> {
    private state: FunctionInfoState = {
        selectedFnIdx: null,
    };

    //   const { shiftUp, shiftDown } = Contracts.useContainer();
    //   const [selectedIdx, setSelectedIdx] = useState(null);

    // // keyboard press behaviour (should really be somewhere else)
    // useEvent("keydown", (e) => {
    //     if (e.key === "ArrowUp") {
    //     e.preventDefault();
    //     if (selectedIdx !== null) {
    //         setSelectedIdx((prev) => (prev === 0 ? 0 : prev - 1));
    //     } else {
    //         // move contracts up
    //         shiftUp();
    //     }
    //     }
    //     if (e.key === "ArrowDown") {
    //     e.preventDefault();
    //     if (selectedIdx !== null) {
    //         setSelectedIdx((prev) => (prev === fns.length - 1 ? prev : prev + 1));
    //     } else {
    //         // move contracts down
    //         shiftDown();
    //     }
    //     }
    // });

    // // unselect functions if the contract changes
    // useEffect(() => {
    //     setSelectedIdx(null);
    // }, [contract]);

    oninit(vnode) {
        this.state.selectedFnIdx = 0;
        // grab only functions from ABI and sort alphabetically
        let fns, selectedFn;
        if (vnode.attrs.contract) {
            fns = JSON.parse(vnode.attrs.contract.abi)
            .filter((x) => x.type === "function")
            .sort((a, b) => a.name.localeCompare(b.name));
            selectedFn = fns[selectedIdx];
        } else {
            fns = [];
            selectedFn = null;
        }
    }

    view(vnode) {

        return (
            <div>
                <FunctionList
                    selectedIdx={selectedIdx}
                    setSelectedIdx={setSelectedIdx}
                    fns={fns}
                />
                <FunctionDetails fn={selectedFn} />
                <FunctionCall fn={selectedFn} />
            </div>
        );
    }
}

export default FunctionInfo;
