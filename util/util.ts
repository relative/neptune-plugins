const NOOP = () => {}
export async function promiseTimeout<T>(
  // prettier-ignore
  executor: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void
  ) => void,
  timeoutMs: number,
  cleanupFn?: () => PromiseLike<void> | void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const clearTimer =
      timeoutMs <= 0
        ? NOOP
        : clearTimeout.bind(
            null,
            setTimeout(async () => {
              clearTimer()
              if (cleanupFn) await cleanupFn()
              reject(new Error('Timeout exceeded'))
            }, timeoutMs)
          )
    const asyncClearTimer = async () => {
      try {
        if (cleanupFn) await cleanupFn()
      } catch (err) {
        console.warn('Error in asyncClearTimer', err)
      }
    }
    return executor(
      value => asyncClearTimer().then(_ => resolve(value)),
      reason => asyncClearTimer().then(_ => reject(reason))
    )
  })
}
