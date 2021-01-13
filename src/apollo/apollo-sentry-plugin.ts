import { ApolloError } from 'apollo-server-koa';
import { Sentry } from '../sentry';

export const apolloSentryPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(ctx: any) {
        for (const err of ctx.errors) {
          // ApolloErrors are user facing, we are interested in internal errors
          if (err instanceof ApolloError) {
            continue;
          }

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
