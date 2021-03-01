import { Sentry } from '../sentry';

export const apolloSentryPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(ctx: any) {
        for (const err of ctx.errors) {
          Sentry.withScope(scope => {
            scope.setTag('kind', ctx.operation.operation);
            scope.setExtra('query', ctx.request.query);
            scope.setExtra('variables', ctx.request.variables);
            if (err.path) {
              scope.addBreadcrumb({
                category: 'query-path',
                message: err.path.join(' > '),
                level: Sentry.Severity.Debug,
              });
            }
            Sentry.captureException(err);
          });
        }
      },
    };
  },
};
