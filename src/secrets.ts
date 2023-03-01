import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import assert from 'assert';

const secretCache: Record<string, string> = {};
let defaultClient: SecretsManagerClient | undefined;

const getClient = (): SecretsManagerClient => {
  if (!defaultClient) {
    assert(
      process.env.AWS_REGION,
      'getSecret requires process.env.AWS_REGION to be set'
    );
    defaultClient = new SecretsManagerClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.LOCALSTACK_URL,
    });
  }
  return defaultClient;
};

export const getSecret = async (secretName: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await getClient().send(command);

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

export const getAppSecret = async (secretName: string) => {
  if (secretCache[secretName]) {
    return secretCache[secretName];
  }

  const envValue =
    process.env.NODE_ENV !== 'production' ? process.env[secretName] : undefined;
  if (envValue) {
    secretCache[secretName] = envValue;
    return envValue;
  }

  const secretEnvKey = `${secretName}_SECRET_NAME`;
  const awsSecretName = process.env[secretEnvKey];
  if (!awsSecretName) {
    throw new Error(`No env variable for ${secretEnvKey}`);
  }

  const secretsManagerValue = await getSecret(awsSecretName);
  secretCache[secretName] = secretsManagerValue;
  return secretsManagerValue;
};
