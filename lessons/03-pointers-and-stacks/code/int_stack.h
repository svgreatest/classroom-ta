#ifndef INT_STACK_H
#define INT_STACK_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Concrete Integer Stack with Dynamic Array Resizing.
 * Demonstrates:
 * - Pointers to heap arrays (int *items)
 * - Dynamic capacity doubling with realloc
 * - Passing struct pointers to mutate stack state
 */
typedef struct {
    int *items;      // Dynamically allocated array on the heap
    int capacity;   // Total available slots
    int top;        // Number of elements currently stored
} IntStack;

// Create a new integer stack with an initial capacity
IntStack* int_stack_create(int initial_capacity);

// Push a value onto the stack; doubles capacity if full
bool int_stack_push(IntStack *s, int value);

// Pop the top value into out_value; returns false if stack is empty
bool int_stack_pop(IntStack *s, int *out_value);

// Peek at top value without removing it
bool int_stack_peek(const IntStack *s, int *out_value);

// Check if stack is empty
bool int_stack_is_empty(const IntStack *s);

// Return current number of elements
int int_stack_size(const IntStack *s);

// Free all heap memory allocated by the stack
void int_stack_destroy(IntStack *s);

#endif // INT_STACK_H
