#include "int_stack.h"
#include <stdio.h>
#include <stdlib.h>

#define DEFAULT_INITIAL_CAPACITY 4

IntStack* int_stack_create(int initial_capacity) {
    if (initial_capacity <= 0) {
        initial_capacity = DEFAULT_INITIAL_CAPACITY;
    }

    IntStack *s = (IntStack*)malloc(sizeof(IntStack));
    if (!s) return NULL;

    s->items = (int*)malloc((size_t)initial_capacity * sizeof(int));
    if (!s->items) {
        free(s);
        return NULL;
    }

    s->capacity = initial_capacity;
    s->top = 0;
    return s;
}

bool int_stack_push(IntStack *s, int value) {
    if (!s) return false;

    // Expand array if capacity reached
    if (s->top >= s->capacity) {
        int new_capacity = s->capacity * 2;
        int *new_items = (int*)realloc(s->items, (size_t)new_capacity * sizeof(int));
        if (!new_items) {
            return false; // Allocation failure; old items preserved
        }
        s->items = new_items;
        s->capacity = new_capacity;
    }

    s->items[s->top] = value;
    s->top++;
    return true;
}

bool int_stack_pop(IntStack *s, int *out_value) {
    if (!s || s->top == 0) {
        return false; // Underflow
    }

    s->top--;
    if (out_value) {
        *out_value = s->items[s->top];
    }
    return true;
}

bool int_stack_peek(const IntStack *s, int *out_value) {
    if (!s || s->top == 0) {
        return false;
    }

    if (out_value) {
        *out_value = s->items[s->top - 1];
    }
    return true;
}

bool int_stack_is_empty(const IntStack *s) {
    return !s || s->top == 0;
}

int int_stack_size(const IntStack *s) {
    return s ? s->top : 0;
}

void int_stack_destroy(IntStack *s) {
    if (!s) return;
    if (s->items) {
        free(s->items);
        s->items = NULL;
    }
    free(s);
}
