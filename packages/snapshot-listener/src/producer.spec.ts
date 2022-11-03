import createMQProducer from './producer';
import { rabbitMQ} from './config';
import { expect } from 'chai';

describe('Producer ', () => {
	it('should return a function', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, "test_queu");
		expect(produceMessage).to.be.a('function');
	});
})
