const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
const isContext = Symbol("isContext");

export type Context = {
  readonly signal?: AbortSignal;
  readonly deadline?: number;
  // hidden symbol to identify Context objects
  [isContext]: true;
};

export type Abortable = {
  readonly ctx: Context;
  readonly abort: () => void;
};

function rootContext(): Context {
  return Object.freeze(
    Object.create(null, {
      [customInspectSymbol]: { value: inspectContext },
      [isContext]: { value: true },
    })
  );
}

export const background = rootContext();
export const TODO = rootContext();

export const requestIdKey = Symbol("requestId");

export function getRequestId(ctx: Context): string | undefined {
  if (requestIdKey in ctx) {
    // typescript doesn't like symbols, but it's safe
    return String((ctx as Record<typeof requestIdKey, unknown>)[requestIdKey]);
  }
}

export function withValues(
  parent: Context,
  values: {
    readonly signal?: AbortSignal;
    readonly deadline?: number;
  } & Record<symbol | string, unknown>
): Context {
  if (!parent[isContext]) throw new TypeError("parent is not a Context");

  const ctx = Object.create(parent);

  for (const key of Object.keys(values)) {
    Object.defineProperty(ctx, key, { value: values[key], enumerable: true });
  }
  for (const key of Object.getOwnPropertySymbols(values)) {
    Object.defineProperty(ctx, key, {
      // typescript doesn't like this, but it's safe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: values[key as any],
      enumerable: true,
    });
  }

  return Object.freeze(ctx);
}

export function withAbort(parent: Context): Abortable {
  const ac = new AbortController();

  function abort() {
    parent.signal?.removeEventListener("abort", abort);
    ac.abort();
  }
  parent.signal?.addEventListener("abort", abort, { once: true });

  const ctx = withValues(parent, { signal: ac.signal });

  return { ctx, abort };
}

export function withDeadline(
  parent: Context,
  deadline: Date | number
): Abortable {
  const dl = typeof deadline === "number" ? deadline : deadline.getTime();

  if (parent.deadline && dl > parent.deadline) {
    return withAbort(parent);
  }

  const ac = new AbortController();

  const t = setTimeout(() => {
    abort();
  }, dl - Date.now());

  function abort(): void {
    parent.signal?.removeEventListener("abort", abort);
    clearTimeout(t);
    ac.abort();
  }
  parent.signal?.addEventListener("abort", abort);

  const ctx = withValues(parent, { signal: ac.signal, deadline: dl });

  return { ctx, abort };
}

export function withTimeout(parent: Context, duration: number): Abortable {
  return withDeadline(parent, Date.now() + duration);
}

function recursiveSpread(obj: object): object {
  const p = Object.getPrototypeOf(obj);
  if (p === null) {
    return { ...obj };
  }
  return { ...recursiveSpread(p), ...obj };
}

function inspectContext(
  this: Context,
  depth: number,
  options: unknown,
  inspect: (obj: unknown, opts: unknown) => string
): string {
  switch (this) {
    case background:
      return "Context< background >";
    case TODO:
      return "Context< TODO >";
  }
  return `Context< ${inspect(recursiveSpread(this), options)} >`;
}
