// Title: What realloc does, step by step
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// What realloc(old, new_size) does when it cannot grow the block in place.
// (When there IS free space right after the block, it may skip steps 1-3.)
int *grow(int *old, int old_count, int new_count) {
    int *bigger = malloc(new_count * sizeof(int));   // 1. new, bigger block
    memcpy(bigger, old, old_count * sizeof(int));     // 2. copy the old bytes
    free(old);                                        // 3. free the old block
    return bigger;                                    // 4. hand back the new address
}

int main() {
    int *items = malloc(2 * sizeof(int));   // block of 2 ints
    items[0] = 10;
    items[1] = 20;                          // full

    int *saved = &items[1];                 // a pointer INTO the old block

    items = grow(items, 2, 4);              // like: items = realloc(items, 4 * sizeof(int));
    items[2] = 30;

    printf("items is now at %p\n", (void *)items);
    printf("saved still holds %p (freed memory!)\n", (void *)saved);

    free(items);
    return 0;
}
