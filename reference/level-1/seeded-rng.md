# Seeded uniform draws (xorshift32)

The full walkthrough, with the seed-1 bit table and the papers, is
[xorshift32.md](xorshift32.md).

`MockRNG` replays a list you wrote down. The real `RNG` has to invent the next
number from a seed, and invent the same number again if the seed is the same.
That is what makes a training run replayable: every later test can pass a seed
instead of hoping `Math.random` cooperates.

## State

The generator keeps one integer, the state. The constructor stores the seed as
that integer. Zero is illegal: every mix of zero is still zero, so every draw
would be 0.

## One draw

`uniform` does not call `Math.random`. It mixes the current state with three
xorshift steps, in this order, and stores the result as the new state:

1. xor the value with itself shifted left by 13
2. xor the value with itself shifted right (unsigned) by 17
3. xor the value with itself shifted left by 5

Shifts and xors must stay inside 32 bits. A JavaScript number will not do that
by itself; the bitwise operators that force a 32-bit integer are the ones to use.
The right shift must be the unsigned kind, or the high bit turns the state negative
and the sequence collapses.

## The unit interval

Return the unsigned 32-bit state divided by 2^32. That quotient sits in `[0, 1)`.
It must never be 1. Two generators with the same seed must return the same
sequence. Two generators with different seeds must disagree.
