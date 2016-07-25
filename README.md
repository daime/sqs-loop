SQS-LOOP
========

SQS polling lib to ease the creation of consumers that run forever.

```bash
npm install --save sqs-loop
```

```js
const sqsLoop = require('sqs-loop');

sqsLoop.aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
});

const params = {
    QueueName: 'awesome-queue', // auto create and resolves queue url
    VisibilityTimeout: 5,
    MaxNumberOfMessages: 5,
    WaitTimeSeconds: 20
};

// Callback will be called once per message in parallel by MaxNumberOfMessages
sqsLoop.loop(params, message => {
    const body = JSON.parse(message.Body);

    /*
     * work with our message
     */

    // If we want to loop no further
    // return sqsLoop.stop();

    // If we want to keep the messsage in SQS
    // return sqsLoop.keep();
});
```

## Return values

 * __sqsLoop.stop()__: stops the loop and resolves the promise
 * __sqsLoop.keep()__: avoid removal of the message from SQS queue
 * __promise rejections__: keep the message on the queue.
 * __promise resolves or normal returns__: removes the message from SQS queue
