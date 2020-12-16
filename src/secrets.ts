import AWS from 'aws-sdk';
import assert from 'assert';

assert(
  process.env.AWS_REGION,
  'getSecret requires process.env.AWS_REGION to be set'
);

const client = new AWS.SecretsManager({
  region: process.env.AWS_REGION,
  endpoint: process.env.LOCALSTACK_URL
    ? new AWS.Endpoint(process.env.LOCALSTACK_URL)
    : undefined,
});

export const getSecret = async (secretName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      if (!data) {
        return reject(new Error('no data from secretsmanager'));
      }

      if (data.SecretString) return resolve(data.SecretString);

      if (data.SecretBinary) {
        let buff: Buffer;
        if (typeof data.SecretBinary == 'string') {
          buff = Buffer.from(data.SecretBinary, 'base64');
        } else {
          // @ts-ignore
          buff = Buffer.from(data.SecretBinary);
        }
        return resolve(buff.toString('ascii'));
      }

      throw new Error(
        `Could not get string or binary secret for ${secretName}`
      );
    });
  });
};
