#include <stdio.h>

// BROKEN: Pass-by-value copies the arguments.
// When this function returns, changes are lost!
void swap_by_value(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

// WORKING: Pass-by-reference using pointers.
// Dereferencing (*a, *b) crosses stack boundaries into main's frame!
void swap_by_pointer(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 10;
    int y = 20;

    printf("Initial values: x = %d, y = %d\n", x, y);

    // 1. Attempt failed swap
    swap_by_value(x, y);
    printf("After swap_by_value: x = %d, y = %d (NO CHANGE!)\n", x, y);

    // 2. Perform working swap with addresses
    swap_by_pointer(&x, &y);
    printf("After swap_by_pointer: x = %d, y = %d (SWAPPED!)\n", x, y);

    return 0;
}
