#ifndef GENERIC_STACK_H
#define GENERIC_STACK_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Generic Stack Abstract Data Type (ADT)
 * 
 * Stores elements of any type using byte-level copying (memcpy).
 * Encapsulates all internal storage details.
 */
typedef struct GenericStack GenericStack;

/**
 * Creates a new generic stack.
 * @param elem_size Size in bytes of each element (e.g., sizeof(int)).
 * @param initial_capacity Starting capacity (doubles as needed).
 * @return Pointer to the allocated GenericStack, or NULL on failure.
 */
GenericStack* stack_create(size_t elem_size, int initial_capacity);

/**
 * Releases all resources associated with the stack.
 */
void stack_destroy(GenericStack *s);

/**
 * Pushes an element onto the top of the stack.
 * @param s Target stack.
 * @param elem Pointer to the data to copy into the stack.
 * @return true on success, false if reallocation fails.
 */
bool stack_push(GenericStack *s, const void *elem);

/**
 * Pops the top element from the stack.
 * @param s Target stack.
 * @param out_elem Pointer to memory where popped element will be copied (can be NULL).
 * @return true if an element was popped, false if the stack was empty (underflow).
 */
bool stack_pop(GenericStack *s, void *out_elem);

/**
 * Inspects the top element without removing it.
 * @param s Target stack.
 * @param out_elem Pointer to memory where top element will be copied.
 * @return true if top exists, false if stack is empty.
 */
bool stack_peek(const GenericStack *s, void *out_elem);

/**
 * Checks whether the stack contains zero elements.
 */
bool stack_is_empty(const GenericStack *s);

/**
 * Returns the current number of elements in the stack.
 */
int stack_size(const GenericStack *s);

#endif // GENERIC_STACK_H
