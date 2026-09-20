#include <stdio.h>

// Example 3: Arrays & Pointer Arithmetic
// In C, array names decay to a pointer to their first element.
// arr[i] is literally syntactic sugar for *(arr + i)!
int main(void) {
    int numbers[4] = {10, 20, 30, 40};
    int *p = numbers; // decays to &numbers[0]

    printf("Array base address: %p\n", (void*)numbers);
    printf("Pointer p address:  %p\n", (void*)p);

    // Reading elements using pointer arithmetic
    for (int i = 0; i < 4; i++) {
        // Notice p + i advances by (i * sizeof(int)) bytes, not i bytes!
        int value = *(p + i);
        printf("Index %d: value = %d (address: %p)\n", i, value, (void*)(p + i));
    }

    // Mutating via pointer offset
    *(p + 2) = 999;
    printf("Mutated numbers[2] via *(p + 2): %d\n", numbers[2]);

    return 0;
}
