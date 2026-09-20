#include <stdio.h>
#include <stdlib.h>

// Example 5: Dynamic Memory on the Heap
// Stack memory is automatically deallocated when a function returns.
// Heap memory persists until explicitly freed with free()!

int* create_dynamic_buffer(int size) {
    // Allocate space on the heap
    int *buffer = (int*)malloc(size * sizeof(int));
    if (buffer == NULL) {
        return NULL; // Allocation failed
    }

    for (int i = 0; i < size; i++) {
        buffer[i] = (i + 1) * 10;
    }

    return buffer; // SAFE: Heap memory survives function return!
}

int main(void) {
    int count = 3;
    int *data = create_dynamic_buffer(count);

    if (data != NULL) {
        printf("Heap buffer successfully allocated at %p\n", (void*)data);
        for (int i = 0; i < count; i++) {
            printf("data[%d] = %d\n", i, data[i]);
        }

        // Always pair malloc with free!
        free(data);
        printf("Heap memory freed.\n");

        // Set to NULL to avoid dangling pointer bug
        data = NULL;
    }

    return 0;
}
