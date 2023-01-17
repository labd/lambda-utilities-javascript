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

// withSpan returns F so generics of passed F stays intact, e.g:
//   const fn = async <T>(t: T) => t
//   const wrapped = withSpan("fn", fn)
//   wrapped<number>(10) // works only when withSpan explicitly returns F
export const withSpan = <F extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: F
): F => {
  // We cast to F because we know it will be correct.
  return ((...args: Parameters<F>) => asSpan(name, fn, ...args)) as F;
};

export const asSpan = async <F extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: F,
  ...args: Parameters<F>
): Promise<Awaited<ReturnType<F>>> => {
  return getTracer().startActiveSpan(name, async (span: Span) => {
    try {
      return await fn.apply(fn, args);
    } catch (err) {
      recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
};

// withSpanSync returns F so generics of passed F stays intact, e.g:
//   const fn = <T>(t: T) => t
//   const wrapped = withSpanSync("fn", fn)
//   wrapped<number>(10) // works only when withSpan explicitly returns F
export const withSpanSync = <F extends (...args: any[]) => any>(
  name: string,
  fn: F
): F => {
  // We cast to F because we know it will be correct.
  return ((...args: Parameters<F>) => asSpanSync(name, fn, ...args)) as F;
};

export const asSpanSync = <F extends (...args: any[]) => any>(
  name: string,
  fn: F,
  ...args: Parameters<F>
): ReturnType<F> => {
  return getTracer().startActiveSpan(name, (span: Span) => {
    try {
      return fn.apply(fn, args);
    } catch (err) {
      recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
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
