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
export class RNG{
    constructor(seed){
        let state = seed | 0
        if (state == 0){
            throw("seed can't be 0!")
        }else{
        this.state = seed | 0 // use seed as the starting point for random number generation
        }
    }
    uniform(){
        let x = this.state
        x = x ^(x << 13)
        x = x ^(x >>>17)
        x = x ^(x << 5)
        this.state = x
        return (x>>>0)/2**32 // use x>>>0 to turn negative number to positive, equal to add 2^32
    }
}