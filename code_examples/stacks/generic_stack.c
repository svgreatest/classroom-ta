#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Production generic stack: flat byte buffer on the heap
typedef struct {
    void *elems;      // Untyped raw byte buffer in memory
    size_t elem_size; // Sizing parameter (sizeof(T))
    int capacity;     // Total elements allocated
    int top;          // Number of elements currently on stack
} GenericStack;

GenericStack* create_stack(size_t elem_size, int capacity) {
    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    s->elem_size = elem_size;
    s->capacity = capacity;
    s->top = 0;
    s->elems = malloc(capacity * elem_size);
    return s;
}

// Generic Push method: copies elem_size bytes into buffer at offset
void push(GenericStack *s, const void *elem_addr) {
    if (s->top >= s->capacity) {
        s->capacity *= 2;
        s->elems = realloc(s->elems, s->capacity * s->elem_size);
    }
    /* DANGER!
    * int *ptr = elem_addr;
    * const int *ptr = (const int *)elem_addr; 
    * *ptr = 10;
    */
    // Calculate raw destination byte offset: base + (top * elem_size)
    char *dest = (char*)s->elems + (s->top * s->elem_size);
    memcpy(dest, elem_addr, s->elem_size);
    s->top++;
}

// Generic Pop method: returns void* pointer to popped item in buffer
void* pop(GenericStack *s) {
    if (s->top == 0) return NULL;
    s->top--;
    // Return untyped void* address of the element
    return (char*)s->elems + (s->top * s->elem_size);
}

void free_stack(GenericStack *s) {
    if (!s) return;
    free(s->elems);
    free(s);
}

int main(void) {
    // ==============================================================
    // 1. GENUINE INTEGER STACK (elem_size = sizeof(int) = 4 bytes)
    // ==============================================================
    printf("--- 1. Generic Integer Stack (int) ---\n");
    GenericStack *int_stack = create_stack(sizeof(int), 3);

    int n1 = 10, n2 = 20, n3 = 30;
    push(int_stack, &n1);
    push(int_stack, &n2);
    push(int_stack, &n3);

    while (int_stack->top > 0) {
        void *raw = pop(int_stack);
        // Cast void* to int* before dereferencing
        int val = *(int*)raw;
        printf("Popped int: %d\n", val);
    }


    printf("\n--- 2. Generic Character Stack (char) ---\n");
    GenericStack *char_stack = create_stack(sizeof(char), 3);

    char c1 = 'A', c2 = 'B', c3 = 'C';
    push(char_stack, &c1);
    push(char_stack, &c2);
    push(char_stack, &c3);

    while (char_stack->top > 0) {
        void *raw = pop(char_stack);
        // Cast void* to char* before dereferencing
        char ch = *(char*)raw;
        printf("Popped char: '%c'\n", ch);
    }

    // Clean up heap memory
    free_stack(int_stack);
    free_stack(char_stack);
    return 0;
}
