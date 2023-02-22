import { Attributes, Span, trace, Tracer } from '@opentelemetry/api';

const getException = (err: unknown): Error | string =>
  err instanceof Error ? err : String(err);

const recordException = (err: unknown): void => {
  const exception = getException(err);
  trace.getActiveSpan()?.recordException(exception);
};

export const logException = (err: unknown): void => {
  recordException(err);
  console.error(getException(err));
};

const getTracer = (): Tracer => {
  return trace.getTracer(process.env.COMPONENT_NAME ?? '');
};

// asSpan calls passed function wrapping it in a OTEL span.
// WARNING: when using a the OTEL lambda layer and the passed
// function throws, the request will take ~5 seconds (!) longer
// somehow blocking things sync. For example:
//   await asSpan('test', async () => {
//     throw new Error()
//   }).catch(() => {})
// This does not happen running with for example OTLP locally.
export async function asSpan<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  // We wrap with own promises instead of allowing the tracer to control
  // the return value or act on async flow so we don't need to trust otel.
  return new Promise<T>((resolve, reject) => {
    getTracer().startActiveSpan(name, (span: Span) => {
      (async () => {
        try {
          resolve(await fn());
        } catch (err) {
          recordException(err);
          reject(err);
        } finally {
          span.end();
        }
      })();
    });
  });
}

// withSpanSync returns F so generics of passed F stays intact, e.g:
//   const fn = <T>(t: T) => t
//   const wrapped = withSpanSync("fn", fn)
//   wrapped<number>(10) // works only when withSpan explicitly returns F
export const withSpan = <F extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: F
): F => {
  // We cast to F because we know it will be correct.
  return (async (...args: Parameters<F>) =>
    asSpan(name, async () => fn(...args))) as F;
};

export const setAppSpanAttr = (attr: Attributes) => {
  const span = trace.getActiveSpan();
  if (!span) return;
  for (const [name, value] of Object.entries(attr)) {
    if (value !== undefined) {
      span.setAttribute(`app.${name}`, value);
    }
  }
};
