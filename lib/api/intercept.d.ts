export type UninterceptFunction = () => void
export function intercept(type: string, cb: CallableFunction, once? = false): UninterceptFunction
export function intercept(types: string[], cb: CallableFunction, once? = false): UninterceptFunction
