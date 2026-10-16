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
// L1.0a — add two methods. Both must call this.uniform(); do not read this.seq yourself.
//
// int(n):
//   take the next uniform draw
//   multiply it by n
//   return that product rounded down to an integer
//
// normal():
//   return the next uniform draw unchanged
//   (tests script z-scores directly, including negatives)
//
// Leave categorical for a later bite.

export class MockRNG{
    constructor(seq){
        this.seq = seq
        this.i = 0
    }
    uniform(){
        let out = this.seq[this.i]
        this.i+=1
        return out
    }
    int(n){
        return Math.floor(this.uniform()*n)
    }
    normal(){
        return this.uniform()
    }
}