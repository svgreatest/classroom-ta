#include <stdio.h>
#include "generic_stack.h"

// -------------------------------------------------------------
// 1. Native C Function Recursion (Compiler/CPU Call Stack)
// -------------------------------------------------------------
int factorial_recursive(int n) {
    if (n <= 1) return 1;
    return n * factorial_recursive(n - 1);
}

// -------------------------------------------------------------
// 2. Explicit Simulation Using GenericStack (Manual Activation Records)
// -------------------------------------------------------------
typedef struct {
    int n;
    int state; // 0: call stage, 1: return/unwind stage
} Frame;

int factorial_simulated(int start_n) {
    GenericStack *call_stack = stack_create(sizeof(Frame), 16);
    int accumulator = 1;

    // Push initial activation record
    Frame initial = { .n = start_n, .state = 0 };
    stack_push(call_stack, &initial);

    while (!stack_is_empty(call_stack)) {
        Frame current;
        stack_pop(call_stack, &current);

        if (current.n <= 1) {
            // Base case reached: start unwinding
            continue;
        }

        if (current.state == 0) {
            // Push current frame back marked for return multiplication
            current.state = 1;
            stack_push(call_stack, &current);

            // Push recursive call frame: factorial(n - 1)
            Frame next = { .n = current.n - 1, .state = 0 };
            stack_push(call_stack, &next);
        } else {
            // Return unwinding step: multiply
            accumulator *= current.n;
        }
    }

    stack_destroy(call_stack);
    return accumulator;
}

int main(void) {
    int n = 5;

    printf("=== Topic 7: Recursion & The Call Stack ===\n");
    printf("1. Native Recursive factorial(%d) = %d\n", n, factorial_recursive(n));
    printf("2. Explicit GenericStack simulation(%d) = %d\n", n, factorial_simulated(n));

    return 0;
}
