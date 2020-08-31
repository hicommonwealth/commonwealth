import { of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { switchMap, catchError } from 'rxjs/operators';
import $ from 'jquery';
import app from 'state';

// export const get = (route, args, callback) => {
//     return $.get(app.serverUrl() + route, args).then((resp) => {
//         if (resp.status === 'Success') {
//             callback(resp.result);
//         } else {
//             console.error(resp);
//         }
//     }).catch((e) => console.error(e));
// };

const stats$ = fromFetch(app.serverUrl() + '/getGlobalStatistics').pipe(
    switchMap(response => {
        if (response.ok) {
            // OK return data
            return response.json();
        } else {
            // Server is returning a status requiring the client to try something else.
            return of({ error: true, message: `Error ${response.status}` });
        }
    }),
    catchError(err => {
        // Network or other error, handle appropriately
        console.error(err);
        return of({ error: true, message: err.message })
    })
);

stats$.subscribe({
    next: result => console.log(result),
    complete: () => console.log('done')
});