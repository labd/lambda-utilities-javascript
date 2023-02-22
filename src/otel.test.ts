import { Span, trace } from '@opentelemetry/api';
import { asSpan, setAppSpanAttr, withSpan } from './otel';

describe('asSpan', () => {
  test('calls passed function correctly', async () => {
    const fn = jest.fn(async () => 'test-result');

    const result = await asSpan('name', fn);

    expect(result).toEqual('test-result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('throws when the function throws', async () => {
    const fn = jest.fn(async () => {
      throw new Error('test error');
    });

    expect(() => asSpan('name', fn)).rejects.toMatchObject(
      new Error('test error')
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('withSpan', () => {
  test('calls passed function correctly', async () => {
    const fn = jest.fn(async () => 'test-result');
    const result = await withSpan('name', fn)();

    expect(result).toEqual('test-result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('throws when the function throws', async () => {
    const fn = jest.fn(async () => {
      throw new Error('test error');
    });

    await expect(() => withSpan('name', fn)()).rejects.toMatchObject(
      new Error('test error')
    );
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
