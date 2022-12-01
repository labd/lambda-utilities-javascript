import { Integrations, AWSLambda } from '@sentry/serverless';
import {
  RewriteFrames,
  Transaction,
  CaptureConsole,
  ExtraErrorData,
} from '@sentry/integrations';

if (process.env.SENTRY_DSN) {
  AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    release: process.env.RELEASE,
    integrations: [
      new CaptureConsole({
        levels: ['warning', 'error'],
      }),
      new RewriteFrames({
        root: '../var/task/',
      }),
      new ExtraErrorData({ depth: 5 }),
      new Transaction(),
      new Integrations.Console(),
      new Integrations.Http({ tracing: false }),
      new Integrations.LinkedErrors(),
      new Integrations.OnUncaughtException(),
      new Integrations.OnUnhandledRejection(),
    ],
    tracesSampleRate: 0,
    ignoreErrors: [/Failed extracting version/],
  });

  AWSLambda.configureScope(function(scope) {
    scope.setTag('service_name', process.env.COMPONENT_NAME || '');
    scope.setTag('site', process.env.SITE || '');
  });
}

export const Sentry = AWSLambda;
