import express from 'express';
import models from '../database';
import app from '../../server';

// const snapshotListener = () => {
//     const app = express();
//     const PORT = 3185;

//     app.use(express.json);
//     app.post("/snapshotHook", (req, res) => {
//         console.log(req.body);

//         const chainToNotify = models.Chain.findOne({ where : {snapshot : req.body.space } });
//         console.log(chainToNotify);

//         res.status(200).end() // Responding is important
//     });

//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// };

const snapshotListener = () => {
    console.log("Listener Active")
    app.use(express.json);
    app.post("/snapshotHook", (req, res) => {
        console.log(req.body);

        const chainToNotify = models.Chain.findOne({ where : {snapshot : req.body.space } });
        console.log(chainToNotify);

        res.status(200).end() // Responding is important
    });

};

export default snapshotListener;



