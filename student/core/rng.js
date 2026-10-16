// L1.0b — real generator. Same seed must replay the same draws.
// Export a class named RNG. Do not call Math.random.
//
// constructor(seed):
//   store the seed as the integer state
//   the seed must be a non-zero integer (zero stays zero forever)
//
// uniform():
//   take the current state as a 32-bit integer x
//   mix x with three xorshift steps, in this order:
//     x becomes x xor (x shifted left 13)
//     x becomes x xor (x shifted right unsigned 17)
//     x becomes x xor (x shifted left 5)
//   store that mixed x as the new state
//   return the unsigned 32-bit value of x, divided by 2 to the 32
//   (that quotient is in [0, 1))
//
// Leave int, normal, and categorical for later bites.
