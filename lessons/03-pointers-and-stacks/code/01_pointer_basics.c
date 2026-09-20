#include <stdio.h>

// Example 1: Understanding Addresses and Dereferencing
// A pointer is simply a variable holding a memory address!
int main(void) {
    int target = 42;
    int *ptr = &target;     // ptr holds the address of target
    int **ptr_to_ptr = &ptr; // pointer to pointer

    printf("Original target: %d\n", target);
    printf("Address of target: %p\n", (void*)&target);
    printf("Value inside ptr:  %p\n", (void*)ptr);

    // Mutation via dereference
    *ptr = 99;
    printf("Mutated target via *ptr: %d\n", target);

    // Mutation via double dereference
    **ptr_to_ptr = 256;
    printf("Mutated target via **ptr_to_ptr: %d\n", target);

    return 0;
}
