
import { Request, Response } from 'express';
import fetch from 'node-fetch';

export const sendMessage = async (
  req: Request,
  res: Response,
) => {
	const init = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: req.body.data
	};
	const url = `${process.env.SNAPSHOT_APP_HUB_URL || 'https://testnet.snapshot.org'}/api/message`;
	fetch(url, init)
		.then((res1) => {
			if (res1.ok) 
				return res.json({ status: 'Success', result: res1.json() });
			throw res1;
		})
		.catch((e) => {
			e.json().then((json) => {
				return res.json({ status: 'Failure', message: json });
			})
		});
};
