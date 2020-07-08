const chai = require('chai');
const mocha = require('mocha');
const awsSDK = require('aws-sdk');
const awsMock = require('aws-sdk-mock');
const SqsLoop = require('./sqs-loop');

const expect = chai.expect;

describe('SqsLoop class', () => {
    it('Reads single message', () => {
        let queueParameters = {
            QueueUrl: 'https://awesome-queue-url.com',
        }

        awsMock.mock('SQS', 'receiveMessage', (params, callback) => {
            callback(null, {Messages: [ {Body: 'awesome message' }]});
        });

        SqsLoop.loop(queueParameters, (message) => {
            expect(message).to.have.property('Body', 'awesome message')
            return SqsLoop.stop();
        });
    });
});