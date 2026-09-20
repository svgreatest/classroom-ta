
#include <stddef.h>
#include <stdlib.h>

typedef struct {
    void *addr;
    size_t size;
    int active;
} __OptHeapBlock;

__OptHeapBlock __opt_heap_blocks[128];
int __opt_heap_count = 0;

static inline void* __opt_track_malloc(size_t sz) {
    void *p = malloc(sz);
    if (p && __opt_heap_count < 128) {
        __opt_heap_blocks[__opt_heap_count].addr = p;
        __opt_heap_blocks[__opt_heap_count].size = sz;
        __opt_heap_blocks[__opt_heap_count].active = 1;
        __opt_heap_count++;
    }
    return p;
}

static inline void __opt_track_free(void *p) {
    if (p) {
        for (int i = 0; i < __opt_heap_count; i++) {
            if (__opt_heap_blocks[i].addr == p) {
                __opt_heap_blocks[i].active = 0;
            }
        }
    }
    free(p);
}

#define malloc(sz) __opt_track_malloc(sz)
#define free(p)    __opt_track_free(p)
#line 1 "usercode.c"

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
