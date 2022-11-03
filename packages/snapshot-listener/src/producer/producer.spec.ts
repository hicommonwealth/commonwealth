import createMQProducer from './producer';
import { rabbitMQ} from '../config';
import { expect } from 'chai';

describe('Producer ', () => {
	const testQueue = 'test-queue';

	it('should return a function', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, testQueue);
		expect(produceMessage).to.be.a('function');
	});

	it('should throw an error if the message is not a string', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, testQueue);
		// @ts-ignore
		expect(() => produceMessage(123)).to.throw();
	});

	it('should throw an error if the message is empty', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, testQueue);
		expect(() => produceMessage('')).to.throw();
	});

	it('should throw an error if the message is undefined', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, testQueue);
		//@ts-ignore
		expect(() => produceMessage(undefined)).to.throw();
	});

	it('should throw an error if the message is null', () => {
		const produceMessage = createMQProducer(rabbitMQ.url, testQueue);
		//@ts-ignore
		expect(() => produceMessage(null)).to.throw();
	});
});
