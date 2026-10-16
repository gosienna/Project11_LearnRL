// MockRNG — script random draws so Level 1 tests are deterministic.
// Never use Math.random() in src/ or in RL unit tests.
//
// TODO: implement the class below (keep the whole body under ~10 lines for now;
//       add categorical() in a later bite if you prefer to split).
//
// constructor(seq)  → store seq, set i = 0
// uniform()         → return seq[i++]  (over-draw → undefined is fine)
// int(n)            → Math.floor(this.uniform() * n)
// normal()          → return this.uniform()  (tests will script z-scores)
//
// See framework/rl-web-tdd-plan.md §0 and framework/level-1-bites.md (L1.0)
// Concept background: reference/k-armed Bandit.pdf

export class MockRNG {
  // your implementation here
  constructor(seq){
    this.seq = seq;
    this.i = 0;
  }
  uniform(){
    return this.seq[this.i++];
  }
  int(n){
    return Math.floor(this.uniform() * n);
  }
  normal(){
    return this.uniform();
  }
}
