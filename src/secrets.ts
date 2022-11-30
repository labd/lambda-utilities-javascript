import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import assert from 'assert';

assert(
  process.env.AWS_REGION,
  'getSecret requires process.env.AWS_REGION to be set'
);

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.LOCALSTACK_URL,
});

export const getSecret = async (secretName: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await client.send(command);

      if (!response) {
        return reject(new Error('no data from secretsmanager'));
      }

      if (response.SecretString) return resolve(response.SecretString);

      if (response.SecretBinary) {
        let buff: Buffer;
        if (typeof response.SecretBinary == 'string') {
          buff = Buffer.from(response.SecretBinary, 'base64');
        } else {
          buff = Buffer.from(response.SecretBinary);
        }
        return resolve(buff.toString('ascii'));
      }

      throw new Error(
        `Could not get string or binary secret for ${secretName}`
      );
    } catch (err) {
      console.error(err);
      return reject(err);
    }
  });
};
