#include "pcg_basic.h"
static pcg32_random_t global_rng = PCG32_INITIALIZER;

  void pcg32_srandom_r(pcg32_random_t* rng, uint64_t initstate, uint64_t initseq){
      rng->state = 0U;    
      rng->inc = (initseq << 1u) | 1u;
      pcg32_random_r(rng);
      rng->state += initstate;
      pcg32_random_r(rng);  
  }

  inline uint32_t pcg32_random_r(pcg32_random_t* rng){
      uint64_t oldstate = rng->state;
      rng->state = oldstate * 6364136223846793005ULL + rng->inc;
      uint64_t xorshifted = ((oldstate >> 18) ^ oldstate) >> 27;
      uint64_t rot = oldstate >> 59;
      return   (xorshifted >> rot) | (xorshifted << ((-rot) & 31));
  }
