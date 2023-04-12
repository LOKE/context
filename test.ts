import * as context from ".";
import assert from "node:assert/strict";

// should abort children
{
  const { abort, ctx } = context.withAbort(context.TODO);
  const { ctx: ctx2 } = context.withAbort(ctx);

  abort();

  assert.ok(ctx.signal?.aborted);
  assert.ok(ctx2.signal?.aborted);
}

// should not abort parent
{
  const { ctx } = context.withAbort(context.background);
  const { ctx: ctx2, abort } = context.withAbort(ctx);

  abort();

  assert.equal(ctx.signal?.aborted, false);
  assert.ok(ctx2.signal?.aborted);
}

// values should be inherited
{
  const key = Symbol("test key");
  const otherKey = Symbol("other");
  const { ctx } = context.withAbort(context.background);
  const ctx2 = context.withValues(ctx, { [key]: "value" });
  const { ctx: ctx3, abort } = context.withAbort(ctx2);
  const ctx4 = context.withValues(ctx3, { [otherKey]: "otherValue" });
  const ctx5 = context.withValues(ctx4, { [key]: "value2" });

  abort();

  assert.equal(getValue(ctx, key), undefined);
  assert.equal(getValue(ctx2, key), "value");
  assert.equal(getValue(ctx3, key), "value");
  assert.equal(getValue(ctx4, key), "value");
  assert.equal(getValue(ctx5, key), "value2");
  assert.equal(getValue(ctx3, otherKey), undefined);
  assert.equal(getValue(ctx5, otherKey), "otherValue");
}

// timeout should abort
{
  const { ctx } = context.withTimeout(context.background, 100);

  assert.equal(ctx.signal?.aborted, false);

  setTimeout(() => {
    assert.ok(ctx.signal?.aborted);
  }, 110);
}

// deadline should abort
{
  const { ctx } = context.withDeadline(context.background, Date.now() + 100);

  assert.equal(ctx.signal?.aborted, false);

  setTimeout(() => {
    assert.ok(ctx.signal?.aborted);
  }, 110);
}

function getValue(ctx: context.Context, key: symbol): unknown {
  if (key in ctx) {
    return (ctx as Record<typeof key, unknown>)[key];
  }
}
