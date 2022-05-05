import { Express } from 'express-serve-static-core';
import models from '../database';
// import app from '../../server';

// const snapshotListener = () => {
//     const app = express();
//     const PORT = 3185;

//     app.use(express.json);
//     app.post("/snapshotHook", (req, res) => {
//         console.log(req.body);

//         const chainToNotify = models.Chain.findOne({ where : {snapshot : req.body.space } });
//         console.log(chainToNotify);

//         res.status(200).end()
//     });

//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// };

const snapshotListener = (app: Express) => {
    console.log("Listener Active")
    app.post("snapshotHook", async (req, res) => {
        console.log(req.body);

        const chainToNotify = await models.Chain.findOne({ where : {snapshot : req.body.space } });
        console.log(chainToNotify);

        res.status(200).end();
    });

};

export default snapshotListener;



