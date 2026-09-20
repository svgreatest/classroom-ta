#include "generic_stack.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DEFAULT_GENERIC_CAPACITY 4

GenericStack* generic_stack_create(size_t elem_size, int initial_capacity) {
    if (elem_size == 0) return NULL;
    if (initial_capacity <= 0) initial_capacity = DEFAULT_GENERIC_CAPACITY;

    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    if (!s) return NULL;

    s->elems = malloc(initial_capacity * elem_size);
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
        int new_capacity = s->capacity * 2;
        void *new_elems = realloc(s->elems, new_capacity * s->elem_size);
        if (!new_elems) {
            return false; // Allocation failure
        }
        s->elems = new_elems;
        s->capacity = new_capacity;
    }

    // Calculate destination byte offset:
    // target = base_addr + (index * elem_size)
    char *target = (char*)s->elems + (s->top * s->elem_size);
    memcpy(target, elem_addr, s->elem_size);
    s->top++;
    return true;
}

void* generic_stack_pop_ptr(GenericStack *s) {
    if (!s || s->top == 0) {
        return NULL; // Underflow
    }

    s->top--;
    return (char*)s->elems + (s->top * s->elem_size);
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

    char *source = (char*)s->elems + ((s->top - 1) * s->elem_size);
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
    if (s->elems) {
        free(s->elems);
        s->elems = NULL;
    }
    free(s);
}
