import { Span, trace } from '@opentelemetry/api';
import {
  asSpan,
  asSpanSync,
  setAppSpanAttr,
  withSpan,
  withSpanSync,
} from './opentelemetry';

describe('asSpan', () => {
  test('calls passed async function correctly', async () => {
    const fn = jest.fn(async (a: number, b: number) => a * b);
    const result = await asSpan('name', fn, 2, 3);

    expect(result).toEqual(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('rejects when the async function rejects', async () => {
    const fn = jest.fn(async (_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(asSpan('name', fn, 2, 3)).rejects.toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('rejects when the function throws', async () => {
    const fn = jest.fn((_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(asSpan('name', fn, 2, 3)).rejects.toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});

describe('withSpan', () => {
  test('calls passed async function correctly', async () => {
    const fn = jest.fn(async (a: number, b: number) => a * b);
    const result = await withSpan('name', fn)(2, 3);

    expect(result).toEqual(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('rejects when the async function rejects', async () => {
    const fn = jest.fn(async (_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(withSpan('name', fn)(2, 3)).rejects.toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('rejects when the function throws', async () => {
    const fn = jest.fn((_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(withSpan('name', fn)(2, 3)).rejects.toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});

describe('asSpanSync', () => {
  test('calls passed function correctly', async () => {
    const fn = jest.fn((a: number, b: number) => a * b);
    const result = asSpanSync('name', fn, 2, 3);

    expect(result).toEqual(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('throws when the function throws', async () => {
    const fn = jest.fn((_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(() => asSpanSync('name', fn, 2, 3)).toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});

describe('withSpanSync', () => {
  test('calls passed function correctly', async () => {
    const fn = jest.fn((a: number, b: number) => a * b);
    const result = withSpanSync('name', fn)(2, 3);

    expect(result).toEqual(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('throws when the function throws', async () => {
    const fn = jest.fn((_a: number, _b: number) => {
      throw new Error('test error');
    });

    expect(() => withSpanSync('name', fn)(2, 3)).toThrow('test error');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});

describe('setAppSpanAttr', () => {
  test('does not throw without active span', async () => {
    jest.spyOn(trace, 'getActiveSpan').mockImplementation(() => undefined);
    setAppSpanAttr({});
  });

  test('sets defined attributes on span as "app.<name>"', async () => {
    const span = ({ setAttribute: jest.fn() } as unknown) as Span;
    jest.spyOn(trace, 'getActiveSpan').mockImplementation(() => span);

    setAppSpanAttr({
      foo: 'value1',
      bar: 'value2',
      empty: '',
      none: undefined,
    });

    expect(span.setAttribute).toHaveBeenCalledTimes(3);
    expect(span.setAttribute).toHaveBeenNthCalledWith(1, 'app.foo', 'value1');
    expect(span.setAttribute).toHaveBeenNthCalledWith(2, 'app.bar', 'value2');
    expect(span.setAttribute).toHaveBeenNthCalledWith(3, 'app.empty', '');
  });
});
