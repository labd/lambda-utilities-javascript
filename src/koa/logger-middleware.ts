import Koa from 'koa';

let defaultOptions = {
  dateFormat(date: number) {
    return new Date(date).toISOString();
  },

  async fillInfo(ctx: Koa.Context) {
    ctx.__logInfo = ctx.state.__logInfo = {};
  },

  async fillError(ctx: Koa.Context) {
    ctx.__infoError = ctx.state.__infoError = Object.assign({}, ctx.__logInfo, {
      query: ctx.request.query,
      method: ctx.request.method,
      url: ctx.request.url,
      DeviceId: ctx.request.get('DeviceId'),
      path: ctx.request.path,
      ip: ctx.request.ip,
      host: ctx.request.host,
      protocol: ctx.request.protocol,
    });
  },

  onStartFormat(ctx: Koa.Context, _info: any) {
    const start = ctx.__logger.start;
    return `--> ${this.dateFormat(start)} - ${ctx.method} ${ctx.url}`;
  },

  async onStart(ctx: Koa.Context) {
    const info = Object.assign({}, ctx.__logInfo, { logType: 'routeStart' });
    console.info(this.onStartFormat(ctx, info));
  },

  onErrorFormat(ctx: Koa.Context, _info: any) {
    return `[ERROR] ${ctx.method} ${ctx.url}`;
  },

  async onError(ctx: Koa.Context, err: Error) {
    // @ts-ignore
    err.expose = process.env.NODE_ENV !== 'production';

    const info = Object.assign({}, ctx.state.__infoError, {
      error: err,
      logType: 'routeError',
    });
    console.error(this.onErrorFormat(ctx, info));

    throw err;
  },

  onEndFormat(ctx: Koa.Context, timeTaken: number, _info: any) {
    const status = ctx.__logger.status;
    const now = this.dateFormat(new Date().getTime());

    return `<-- ${now} - ${status} ${ctx.method} ${ctx.url} - ${timeTaken} ms`;
  },

  async onEnd(ctx: Koa.Context) {
    const timeTaken = Date.now() - ctx.__logger.start;
    const info = Object.assign({}, ctx.__logInfo, { logType: 'routeEnd' });
    console.info(this.onEndFormat(ctx, timeTaken, info));
  },
};

export default (options = {}) => {
  const opt = Object.assign({}, defaultOptions, options);
  const logger = async (ctx: Koa.Context, next: Koa.Next) => {
    ctx.__logger = { status: 500, start: Date.now() };
    try {
      await opt.fillInfo(ctx);
      await opt.fillError(ctx);
      await opt.onStart(ctx);
      await next();
      ctx.__logger.status = ctx.status;
    } catch (err) {
      await opt.onError(ctx, err);
    } finally {
      await opt.onEnd(ctx);
    }
  };
  return logger;
};
