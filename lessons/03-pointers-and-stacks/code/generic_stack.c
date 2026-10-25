#include "generic_stack.h"
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DEFAULT_GENERIC_CAPACITY 4

// Bytes needed for count elements, or 0 if count * elem_size would overflow.
static size_t buffer_bytes(int count, size_t elem_size) {
    if (count <= 0 || (size_t)count > SIZE_MAX / elem_size) return 0;
    return (size_t)count * elem_size;
}

GenericStack* generic_stack_create(size_t elem_size, int initial_capacity) {
    if (elem_size == 0) return NULL;
    if (initial_capacity <= 0) initial_capacity = DEFAULT_GENERIC_CAPACITY;

    size_t bytes = buffer_bytes(initial_capacity, elem_size);
    if (bytes == 0) return NULL; // Size overflow

    GenericStack *s = malloc(sizeof(GenericStack));
    if (!s) return NULL;

    s->elems = malloc(bytes);
    if (!s->elems) {
        free(s);
        return NULL;
    }

    s->elem_size = elem_size;
    s->capacity = initial_capacity;
    s->top = 0;
    return s;
}

bool generic_stack_push(GenericStack *s, const void *elem_addr) {
    if (!s || !elem_addr) return false;

    // Resizing logic: double capacity when full
    if (s->top >= s->capacity) {
        if (s->capacity > INT_MAX / 2) return false; // Capacity overflow
        int new_capacity = s->capacity * 2;

        size_t bytes = buffer_bytes(new_capacity, s->elem_size);
        if (bytes == 0) return false; // Size overflow

        // realloc into a temporary so the old buffer survives a failure
        void *new_elems = realloc(s->elems, bytes);
        if (!new_elems) {
            return false; // Allocation failure; old elements preserved
        }
        s->elems = new_elems;
        s->capacity = new_capacity;
    }

    // Calculate destination byte offset:
    // target = base_addr + (index * elem_size)
    char *target = (char *)s->elems + (size_t)s->top * s->elem_size;
    memcpy(target, elem_addr, s->elem_size);
    s->top++;
    return true;
}

void* generic_stack_pop_ptr(GenericStack *s) {
    if (!s || s->top == 0) {
        return NULL; // Underflow
    }

    s->top--;
    char *source = (char *)s->elems + (size_t)s->top * s->elem_size;
    return source;
}

bool generic_stack_pop(GenericStack *s, void *out_elem) {
    void *source = generic_stack_pop_ptr(s);
    if (!source) {
        return false; // Underflow
    }

    if (out_elem) {
        memcpy(out_elem, source, s->elem_size);
    }
    return true;
}

bool generic_stack_peek(const GenericStack *s, void *out_elem) {
    if (!s || s->top == 0 || !out_elem) {
        return false;
    }

    char *source = (char *)s->elems + (size_t)(s->top - 1) * s->elem_size;
    memcpy(out_elem, source, s->elem_size);
    return true;
}

bool generic_stack_is_empty(const GenericStack *s) {
    return !s || s->top == 0;
}

int generic_stack_size(const GenericStack *s) {
    return s ? s->top : 0;
}

void generic_stack_destroy(GenericStack *s) {
    if (!s) return;
    free(s->elems);  // free(NULL) is a no-op, no check needed
    s->elems = NULL;
    free(s);
}
