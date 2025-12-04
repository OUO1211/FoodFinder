#ifndef PCG_BASIC_H
#define PCG_BASIC_H
#include <inttypes.h>

#ifdef __cplusplus
extern "C" { // <--- 告訴 C++ 編譯器，裡面的函式是 C 函式
#endif

    typedef struct {
    uint64_t state;
    uint64_t inc;
    } pcg32_random_t;

    #define PCG32_INITIALIZER { 0x853c49e6748fea9bULL, 0xda3e39cb94b95bULL }

    void     pcg32_srandom_r(pcg32_random_t* rng, uint64_t initstate, uint64_t initseq);
    void     pcg32_srandom(uint64_t seed, uint64_t seq);
    uint32_t pcg32_random_r(pcg32_random_t* rng);
    uint32_t pcg32_random(void);
    uint32_t pcg32_boundedrand_r(pcg32_random_t* rng, uint32_t bound);
    uint32_t pcg32_boundedrand(uint32_t bound);

#ifdef __cplusplus
} // <--- 關閉 extern "C"
#endif

#endif /* PCG_BASIC_H */