const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function scheduleMicrotask(callback: () => void) {
  sleep(0).then(callback)
}

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

export function createNotifyManager() {
  let queue: NotifyCallback[] = []
  let transactions = 0
  let notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  let batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
    callback()
  }

  const flush = (): void => {
    const originalQueue = queue
    queue = []
    if (originalQueue.length) {
      scheduleMicrotask(() => {
        batchNotifyFn(() => {
          originalQueue.forEach((callback) => {
            notifyFn(callback)
          })
        })
      })
    }
  }

  const batch = <T>(callback: () => T): T => {
    let result
    transactions++
    try {
      result = callback()
    }
    finally {
      transactions--
      if (!transactions)
        flush()
    }
    return result
  }

  const schedule = (callback: NotifyCallback): void => {
    if (transactions) {
      queue.push(callback)
    }
    else {
      scheduleMicrotask(() => {
        notifyFn(callback)
      })
    }
  }

  const batchCalls = <T extends (...args: any[]) => any>(callback: T): T => {
    return ((...args: any[]) => {
      schedule(() => {
        callback(...args)
      })
    }) as any
  }

  const setNotifyFunction = (fn: NotifyFunction) => {
    notifyFn = fn
  }

  const setBatchNotifyFunction = (fn: BatchNotifyFunction) => {
    batchNotifyFn = fn
  }

  return {
    batch,
    batchCalls,
    schedule,
    setNotifyFunction,
    setBatchNotifyFunction,
  } as const
}

export const scheduleManager = createNotifyManager()
