import { Integrations, AWSLambda } from '@sentry/serverless';
import {
  RewriteFrames,
  Transaction,
  CaptureConsole,
} from '@sentry/integrations';
import { addExtensionMethods } from '@sentry/tracing';

if (process.env.SENTRY_DSN) {
  addExtensionMethods();

  AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    enabled: !!process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    release: process.env.RELEASE,
    integrations: [
      new Integrations.Console(),
      new RewriteFrames(),
      new Transaction(),
      new Integrations.Http({ tracing: true }),
      new CaptureConsole({
        levels: ['warning', 'error'],
      }),
    ],
  });

  AWSLambda.configureScope(function(scope) {
    scope.setTag('service_name', process.env.COMPONENT_NAME || '');
    scope.setTag('site', process.env.SITE || '');
  });
}

export const Sentry = AWSLambda;
