'use strict';

const aws = require('aws-sdk');
const bb = require('bluebird');

const sqs = new aws.SQS();
bb.promisifyAll(sqs);

const STOP_STRING = 'PLXSTAHPKTHXBYE';
const KEEP_STRING = 'CHANGEFRIGHTENME';
function stop_loop() {
    return bb.reject(STOP_STRING);
}

function keep() {
    return bb.reject(KEEP_STRING);
}

function readMessage(params) {
    return sqs.receiveMessageAsync(params);
}

function removeMessage(url, msg) {
    var params = {
        QueueUrl: url,
        ReceiptHandle: msg.ReceiptHandle
    };
    return sqs.deleteMessageAsync(params);
}

function readMessageLoop(params, cb) {
    function promiseLoop() {
        let stop = false;
        return readMessage(params)
            .then(res => {
                if (!res.Messages) {
                    return [];
                }
                const sent = res.Messages.map(msg => {
                    try {
                        return cb(msg).then(() => bb.resolve(msg)).reflect();
                    } catch(e) {
                        return bb.reject(e);
                    }
                });
                return bb.all(sent);
            })
            .then(responses => {
                if (responses.length === 0) {
                    return;
                }
                const fulfiled = [];
                responses.forEach(res => {
                    if (res.isFulfilled()) {
                        fulfiled.push(res.value());
                        return;
                    }

                    if (res.reason() === STOP_STRING) {
                        stop = true;
                        return;
                    }

                    if (res.reason() === KEEP_STRING) {
                        return;
                    }
                });

                return bb.all(fulfiled.map(res => removeMessage(params.QueueUrl, res)));
            })
            .then(() => {
                if (stop) {
                    return;
                }
                return promiseLoop();
            });
    }
    return promiseLoop();
}

function loop(params, cb) {
    let promise = bb.resolve(params.QueueUrl);

    if (!params.QueueUrl) {
        promise = promise
            .then(() => sqs.createQueueAsync({ QueueName: params.QueueName }))
            .then(res => res.QueueUrl);
    }

    const _params = JSON.parse(JSON.stringify(params));
    delete _params.QueueName;

    return promise
        .then(url => {
            _params.QueueUrl = url;
            return _params;
        })
        .then(params => readMessageLoop(params, cb));
}

module.exports = { loop, stop: stop_loop, keep };
