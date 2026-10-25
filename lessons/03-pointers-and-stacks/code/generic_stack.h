#ifndef GENERIC_STACK_H
#define GENERIC_STACK_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Production-Grade Generic Stack in pure C.
 * 
 * Instead of requiring dynamic allocation for every item (void* pointer chasing),
 * this implementation manages a flat, contiguous byte buffer on the heap
 * and copies element values directly using memcpy and pointer arithmetic.
 * 
 * Stores ANY C data type: primitives, pointers, arrays, or structs!
 */
typedef struct {
    void *elems;        // Raw contiguous byte buffer on the heap
    size_t elem_size;   // Size of each element in bytes (sizeof(T))
    int capacity;       // Total number of elements currently allocated
    int top;            // Current number of elements stored
} GenericStack;

// Initialize a generic stack for elements of size elem_size
GenericStack* generic_stack_create(size_t elem_size, int initial_capacity);

// Push an element by copying elem_size bytes from elem_addr into the stack
bool generic_stack_push(GenericStack *s, const void *elem_addr);

// Pop the top element by copying elem_size bytes into out_elem (if not NULL)
bool generic_stack_pop(GenericStack *s, void *out_elem);

// Pop the top element and return a void* pointer directly to it (allows caller to cast to appropriate type)
// The pointer is only valid until the next push: push may overwrite the slot or realloc the buffer.
void* generic_stack_pop_ptr(GenericStack *s);

// Peek at the top element by copying elem_size bytes into out_elem without removing it
bool generic_stack_peek(const GenericStack *s, void *out_elem);

// Check if stack is empty
bool generic_stack_is_empty(const GenericStack *s);

// Return current number of elements
int generic_stack_size(const GenericStack *s);

// Free all allocated buffer memory
void generic_stack_destroy(GenericStack *s);

#endif // GENERIC_STACK_H
