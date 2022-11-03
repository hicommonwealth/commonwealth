import createMQProducer from './producer';
import { rabbitMQ} from './config';
import { expect } from 'chai';

describe('Producer ', () => {
	it('should return a function', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, "test_queu");
		expect(produceMessage).to.be.a('function');
	});

	it('should throw an error if the message is not a string', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, "test_queue");
		// @ts-ignore
		expect(() => produceMessage(123)).to.throw();
	});

	it('should throw an error if the message is empty', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, "test_queue");
		expect(() => produceMessage('')).to.throw();
	});

	it('should throw an error if the message is undefined', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, "test_queue");
		//@ts-ignore
		expect(() => produceMessage(undefined)).to.throw();
	});

})
