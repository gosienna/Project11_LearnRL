// L1.0 — scripted random source. Later tests inject this instead of Math.random.
// Export a class named MockRNG.
//
// constructor(seq):
//   remember the scripted sequence
//   start an index at the first item
//
// uniform():
//   return the number at the current index
//   then advance the index by one
//   (running past the end should yield undefined — that is the signal you over-drew)
//
// Leave int, normal, and categorical for later bites.

export class MockRNG{
    constructor(){}
    uniform(){}
}