
import { Attributes, Span, trace } from '@opentelemetry/api'

const withSpan = <F extends (...args: any[]) => any>(
    name: string,
    fn: F
): ((...args: Parameters<F>) => ReturnType<F>) => {
    return (...args) => asSpan(name, fn, ...args)
}
  
const asSpan = <F extends (...args: any[]) => any>(
    name: string,
    fn: F,
    ...args: Parameters<F>
): ReturnType<F> => {
    const tracer = trace.getTracer(process.env.COMPONENT_NAME ?? '')

    return tracer.startActiveSpan(name, (span: Span) => {
        try {
            return fn.apply(fn, args)
        } catch (err) {
            span.recordException(err instanceof Error ? err : String(err))
            throw err
        } finally {
            span.end()
        }
    })
}
  
const setAppSpanAttr = (attr: Attributes) => {
    const span = trace.getActiveSpan()

    if (!span) return
    
    for (const [name, value] of Object.entries(attr)) {
        if (value !== undefined) {
            span.setAttribute(`app.${name}`, value)
        }
    }
}

export default {
    withSpan,
    asSpan,
    setAppSpanAttr
}