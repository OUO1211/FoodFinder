#include <emscripten/emscripten.h>
#include "pcg_basic.h"
#include <vector>
#include <algorithm>
using namespace std;
static vector<int> indices_to_pick;
static int current_size = 0;
static pcg32_random_t global_rng = PCG32_INITIALIZER;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void initialize(int totalCount){
    indices_to_pick.clear();
    for(int i = 0; i < totalCount; i++){
        indices_to_pick.push_back(i);
    }
    current_size = totalCount;
}

EMSCRIPTEN_KEEPALIVE
int getRandomIndex(){
        if(current_size <= 0){
            return -1;
        }

        uint32_t random = pcg32_random_r(&global_rng);
        int index = random % current_size;
        int result = indices_to_pick[index];
        swap(indices_to_pick[index], indices_to_pick[current_size - 1]);
        current_size--;
        return result;
    }

} // extern "C"
