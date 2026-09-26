#include "generic_stack.h"
#include <stdlib.h>
#include <string.h>

#define DEFAULT_CAPACITY 8

struct GenericStack {
    void *buffer;         // Contiguous heap memory
    size_t elem_size;     // Size of each element in bytes
    int capacity;         // Allocated element slots
    int top;              // Number of elements currently present
};

GenericStack* stack_create(size_t elem_size, int initial_capacity) {
    if (elem_size == 0) return NULL;
    if (initial_capacity <= 0) initial_capacity = DEFAULT_CAPACITY;

    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    if (!s) return NULL;

    s->buffer = malloc(initial_capacity * elem_size);
    if (!s->buffer) {
        free(s);
        return NULL;
    }

    s->elem_size = elem_size;
    s->capacity = initial_capacity;
    s->top = 0;
    return s;
}

void stack_destroy(GenericStack *s) {
    if (!s) return;
    if (s->buffer) {
        free(s->buffer);
        s->buffer = NULL;
    }
    free(s);
}

bool stack_push(GenericStack *s, const void *elem) {
    if (!s || !elem) return false;

    // Geometric resizing: double capacity when saturated
    if (s->top >= s->capacity) {
        int new_capacity = s->capacity * 2;
        void *new_buffer = realloc(s->buffer, new_capacity * s->elem_size);
        if (!new_buffer) return false;
        s->buffer = new_buffer;
        s->capacity = new_capacity;
    }

    char *target = (char*)s->buffer + (s->top * s->elem_size);
    memcpy(target, elem, s->elem_size);
    s->top++;
    return true;
}

bool stack_pop(GenericStack *s, void *out_elem) {
    if (!s || s->top <= 0) return false;

    s->top--;
    if (out_elem) {
        char *src = (char*)s->buffer + (s->top * s->elem_size);
        memcpy(out_elem, src, s->elem_size);
    }
    return true;
}

bool stack_peek(const GenericStack *s, void *out_elem) {
    if (!s || s->top <= 0 || !out_elem) return false;

    char *src = (char*)s->buffer + ((s->top - 1) * s->elem_size);
    memcpy(out_elem, src, s->elem_size);
    return true;
}

bool stack_is_empty(const GenericStack *s) {
    return !s || s->top == 0;
}

int stack_size(const GenericStack *s) {
    return s ? s->top : 0;
}
