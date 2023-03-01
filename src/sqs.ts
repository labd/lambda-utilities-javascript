import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

let defaultClient: SQSClient | undefined;

const getClient = (): SQSClient => {
  if (!defaultClient) {
    defaultClient = new SQSClient({
      region: process.env.AWS_REGION,
      apiVersion: '2012-11-05',
      endpoint: process.env.LOCALSTACK_URL,
    });
  }
  return defaultClient;
};

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
    const command = new SendMessageCommand(params);
    const data = await getClient().send(command);

    console.info('Send message to SQS queue');
    console.info(' > messageId:', data.MessageId);
    console.info(' > data:', data);
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};
