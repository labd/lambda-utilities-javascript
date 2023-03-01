import { SeverityLevel } from '@sentry/serverless';
import { LambdaSentry } from '../sentry';

export const apolloSentryPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(ctx: any) {
        for (const err of ctx.errors) {
          LambdaSentry.withScope(scope => {
            scope.setTag('kind', ctx.operation.operation);
            scope.setExtra('query', ctx.request.query);
            scope.setExtra('variables', ctx.request.variables);
            if (err.path) {
              scope.addBreadcrumb({
                category: 'query-path',
                message: err.path.join(' > '),
                level: 'debug' as SeverityLevel,
              });
            }
            LambdaSentry.captureException(err);
          });
        }
      },
    };
  },
};
