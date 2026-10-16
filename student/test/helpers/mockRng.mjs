import { MockRNG } from "./mockRng.js";

let random_seq = new MockRNG([0, 0.25, 0.99])
let arm = [10,4,10]
for (let i = 0; i<arm.length; i++){
    console.log(random_seq.int(arm[i]))
}
let random_seq2 = new MockRNG([0.5, -1.2])
for (let i = 0; i<2; i++){
    console.log(random_seq2.normal())
}