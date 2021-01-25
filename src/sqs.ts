import AWS from 'aws-sdk';
import SQS from 'aws-sdk/clients/sqs';

const sqs = new SQS({
  region: process.env.AWS_REGION,
  apiVersion: '2012-11-05',
  endpoint: process.env.LOCALSTACK_URL
    ? new AWS.Endpoint(process.env.LOCALSTACK_URL)
    : undefined,
});

/*
 * data should NOT yet be stringified
 */
export const sendSqsMessage = async (
  queueUrl: string,
  data: any,
  messageGroupId?: string
) => {
  var params = {
    MessageAttributes: {},
    MessageBody: JSON.stringify(data),
    QueueUrl: queueUrl,
    MessageGroupId: messageGroupId,
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
