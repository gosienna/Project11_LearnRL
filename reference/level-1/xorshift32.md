# Xorshift32: one seed, one fraction

Each draw of `RNG.uniform` keeps a single 32-bit integer, scrambles it, and
turns that integer into a fraction in `[0, 1)`. The scramble is **xorshift32**.
The same seed always produces the same sequence, which is why a training run
can be replayed. `Math.random` cannot do that: it takes no seed.

`MockRNG` is the other tool. It does not scramble anything. It plays back a
list you wrote down so a test can force the next draw. `RNG` is what the real
loop will call.

An interactive version of the bit rows below is the canvas
[Xorshift32 bits](/Users/chenkewei/.cursor/projects/Users-chenkewei-Desktop-github-Project11-LearnRL/canvases/xorshift32-bits.canvas.tsx).
Change the seed there and step one draw at a time.

## XOR

XOR compares two bits and returns 1 when they differ, 0 when they match.

| first bit | second bit | XOR |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

On a whole integer, XOR does that at every bit position at once. The bits of 6
are `0110` and the bits of 3 are `0011`. Position by position the result is
`0101`, which is 5. In JavaScript the operator is `^`.

Xorshift uses XOR against a **shifted copy of the same integer**. A shift slides
every bit sideways. XOR then writes a 1 wherever the original and the slid copy
disagree, so a bit is mixed with a bit that used to sit several places away.

## The 32-bit state

JavaScript numbers are floating point. The generator needs a 32-bit integer, so
the constructor forces the seed down with a bitwise OR against zero (`| 0`).
That drops the fraction and wraps the value into a signed 32-bit integer. Store
that integer on one field, `state`. Every later draw reads it and overwrites it.

Zero is illegal. Every shift of zero is zero, and XOR of zero with zero is zero,
so every draw would be 0. Refuse the seed when the 32-bit result is 0. A value
that looks non-zero as an ordinary number can still become zero once only 32
bits remain, so check **after** the conversion.

## One draw

Take the current state as `x`. Replace `x` three times, in this order:

1. XOR `x` with itself shifted left by 13. The left shift operator is `<<`.
   Bits slide toward the high end.
2. XOR `x` with itself shifted right by 17. This shift must be the unsigned
   one, `>>>`. The signed right shift, `>>`, copies the sign bit, and once the
   high bit is set the sequence collapses.
3. XOR `x` with itself shifted left by 5.

Store the final `x` as the new state **before** returning. The next call must
mix that new integer, not the original seed.

The return value is not `x` itself. JavaScript’s bitwise operators treat the
result as a signed integer, so `x` may be negative, and a negative number is
outside `[0, 1)`. Reinterpret the same bits as an unsigned 32-bit integer
(unsigned right shift by zero), then divide by 2^32, which is 4294967296. The
quotient sits in `[0, 1)`. It can be 0. It is never 1. Consecutive unsigned
values are spaced by `1 / 2^32`.

## Walk seed 1

Bits are written high-end first: bit 31 on the left, bit 0 on the right. Only
the low part of the word changes in this first draw, so the leading zeros are
real.

| step | integer | bits | what happened |
| --- | --- | --- | --- |
| start | 1 | `00000000000000000000000000000001` | a single 1 at the low end |
| XOR, left 13 | 8193 | `00000000000000000010000000000001` | that 1 is copied 13 places higher, and the original low bit stays because XOR with 0 is 1 |
| XOR, unsigned right 17 | 8193 | `00000000000000000010000000000001` | 8193 is smaller than 2^17, so the shift slides every bit off the end and leaves 0. XOR with 0 changes nothing. This step is idle for this state |
| XOR, left 5 | 270369 | `00000000000001000010000000100001` | bits slide 5 places higher and XOR keeps every position where the two patterns differ |

270369 is the new state. As a fraction, `270369 / 2^32` is about `0.000063`.
That is the first `uniform()` from seed 1.

Call `uniform` again and the input is 270369, not 1. The next stored state is
67634689, and the fraction is about `0.015747`.

Seed 2 follows the same three steps and the first fraction is about `0.000126`
(unsigned state 540738). Same rules, different seed, different number.

## Why the sequence looks random

Nothing in the process picks a bit at random. Each step folds distant bits onto
each other, and the triple of shifts (13, 17, 5) visits every non-zero 32-bit
pattern before it repeats. The period is `2^32 - 1`. That is long enough for
the bandit demos in this level, and short by modern generator standards.

## Sources

- George Marsaglia, [Xorshift RNGs](https://www.jstatsoft.org/article/view/v008i14/)
  (Journal of Statistical Software, 2003). The shifts 13, 17, and 5 are the
  32-bit example in that paper. A PDF mirror is
  [marsaglia_xorshift_rng.pdf](https://www.dkl9.net/archive/marsaglia_xorshift_rng.pdf).
- [How does XorShift32 work?](https://stackoverflow.com/questions/53886131/how-does-xorshift32-works)
  walks through the function and the stuck-at-zero state.
- [Wikipedia: Xorshift](https://en.wikipedia.org/wiki/Xorshift) is the short
  overview of the family.
