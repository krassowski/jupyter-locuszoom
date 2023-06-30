async function sleep(timeout: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

export function untilReady(
  isReady: CallableFunction,
  maxRetrials = 15,
  interval = 75,
  intervalModifier = (i: number) => i
): Promise<CallableFunction> {
  return (async () => {
    let i = 0;
    while (isReady() !== true) {
      i += 1;
      if (maxRetrials !== -1 && i > maxRetrials) {
        throw Error('Too many retrials');
      }
      interval = intervalModifier(interval);
      await sleep(interval);
    }
    return isReady;
  })();
}
