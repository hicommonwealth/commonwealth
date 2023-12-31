import * as _18 from './base/abci/v1beta1/abci';
import * as _19 from './base/kv/v1beta1/kv';
import * as _20 from './base/query/v1beta1/pagination';
import * as _21 from './base/reflection/v1beta1/reflection';
import * as _22 from './base/reflection/v2alpha1/reflection';
import * as _23 from './base/snapshots/v1beta1/snapshot';
import * as _24 from './base/store/v1beta1/commit_info';
import * as _25 from './base/store/v1beta1/listening';
import * as _26 from './base/tendermint/v1beta1/query';
import * as _144 from './base/tendermint/v1beta1/query.lcd';
import * as _27 from './base/v1beta1/coin';
import * as _51 from './gov/v1/genesis';
import * as _52 from './gov/v1/gov';
import * as _53 from './gov/v1/query';
import * as _148 from './gov/v1/query.lcd';
import * as _54 from './gov/v1/tx';
import * as _119 from './gov/v1/tx.amino';
import * as _133 from './gov/v1/tx.registry';
export namespace cosmos {
  export namespace base {
    export namespace abci {
      export const v1beta1 = { ..._18 };
    }
    export namespace kv {
      export const v1beta1 = { ..._19 };
    }
    export namespace query {
      export const v1beta1 = { ..._20 };
    }
    export namespace reflection {
      export const v1beta1 = { ..._21 };
      export const v2alpha1 = { ..._22 };
    }
    export namespace snapshots {
      export const v1beta1 = { ..._23 };
    }
    export namespace store {
      export const v1beta1 = { ..._24, ..._25 };
    }
    export namespace tendermint {
      export const v1beta1 = { ..._26, ..._144 };
    }
    export const v1beta1 = { ..._27 };
  }
  export namespace gov {
    export const v1 = {
      ..._51,
      ..._52,
      ..._53,
      ..._54,
      ..._119,
      ..._133,
      ..._148,
    };
  }
}
