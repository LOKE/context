# @loke/context

A typescript version of the go context package.

## Installation

```bash
npm install @loke/context
```

## Usage

```typescript
import * as context from "@loke/context";
import { Context } from "@loke/context";

async function getUser(cxt: Context, id: string): Promise<unknown> {
  const { ctx, abort } = context.withTimeout(cxt, 1000);

  try {
    const res = await fetch(`/users/${id}`, { signal: ctx.signal });

    if (res.ok) {
      throw new Error("not ok");
    }

    return await res.json();
  } finally {
    abort();
  }
}
```

## API

### Context

```typescript
type Context = {
  readonly signal?: AbortSignal;
  readonly deadline?: number;
};
```

### Abortable

```typescript
type Abortable = {
  readonly ctx: Context;
  readonly abort: () => void;
};
```

### background

```typescript
const background: Context;
```

### TODO

```typescript
const TODO: Context;
```

### withAbort(parent: [Context](#context)): [Abortable](#abortable);

- `parent` - The parent context to extend.

Extends the parent context with an abortable signal. The signal is aborted when
the returned abort function is called or when the parent context is aborted.

The returned `about` function **MUST** be called to avoid memory leaks.

### withTimeout(parent: [Context](#context), duration: number): [Abortable](#abortable);

- `parent` - The parent context to extend.
- `duration` - The timeout in milliseconds.

Extends the parent context with an abortable signal. The signal is aborted when
the returned abort function is called, when the parent context is aborted or
when the timeout is reached.

The returned `about` function **MUST** be called to avoid memory leaks.

### withDeadline(parent: [Context](#context), deadline: Date | number): [Abortable](#abortable);

- `parent` - The parent context to extend.
- `deadline` - The deadline as a date or a timestamp in milliseconds.

Extends the parent context with an abortable signal. The signal is aborted when
the returned abort function is called, when the parent context is aborted or
when the deadline is reached.

The returned `about` function **MUST** be called to avoid memory leaks.

### withValues(parent: [Context](#context), values: Record<symbol | string, unknown>): [Context](#context);

- `parent` - The parent context to extend.
- `values` - The values to add to the context.

Extends the parent context with a set of values. To help with type safety the
keys should be symbols, and accessed using custom getters. You can also use a
custom setter to ensure that the values are of the correct type, this may be
overkill if you only set the values once.

Example

```typescript
const localeKey = Symbol("locale");

export function withLocale(parent: Context, locale: string): Context {
  return context.withValues(parent, {
    [localeKey]: locale,
  });
}

export function getLocale(ctx: Context): string {
  if (localeKey in ctx) {
    return ctx[localeKey];
  } else {
    return "en";
  }
}
```

## Well known values API

### requestIdKey

```typescript
const requestIdKey: symbol;
```

Example

```typescript
const ctx = context.withValues(context.background, {
  [context.requestIdKey]: "1234",
});
```

### getRequestId(ctx: [Context](#context)): string | undefined;

Example

```typescript
const requestId = getRequestId(ctx);
```
