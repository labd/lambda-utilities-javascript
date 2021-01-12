import AWS from 'aws-sdk';
import SQS from 'aws-sdk/clients/sqs';
import assert from 'assert';

const sqs = new SQS({
  region: process.env.AWS_REGION,
  apiVersion: '2012-11-05',
  endpoint: process.env.LOCALSTACK_URL
    ? new AWS.Endpoint(process.env.LOCALSTACK_URL)
    : undefined,
});

export const sendMessage = async (data: any) => {
  assert(process.env.SQS_QUEUE_URL, 'SQS_QUEUE_URL missing');
  const queue_url = process.env.SQS_QUEUE_URL;

  var params = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify(data),
    QueueUrl: queue_url,
  };

  try {
    const data = await sqs.sendMessage(params).promise();
    const resp = data.$response;

    console.info('Send message to SQS queue');
    console.info(' > messageId:', data.MessageId);
    console.info(' > data:', resp.data);
    if (resp.error) console.error(' > error:', resp.error);
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};
