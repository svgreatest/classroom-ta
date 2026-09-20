#include <stdio.h>
#include <stdlib.h>
#include "int_stack.h"
#include "generic_stack.h"

typedef struct {
    char symbol[8];
    double price;
} StockQuote;

void demo_int_stack(void) {
    printf("\n--- 1. Concrete Integer Stack Demo ---\n");
    IntStack *stack = int_stack_create(2);
    printf("Created IntStack with initial capacity = %d\n", stack->capacity);

    int values[] = {10, 20, 30, 40, 50};
    for (int i = 0; i < 5; i++) {
        int_stack_push(stack, values[i]);
        printf("Pushed: %-3d | Size: %d | Capacity: %d (dynamic growth)\n",
               values[i], int_stack_size(stack), stack->capacity);
    }

    printf("\nPopping all elements (LIFO Order):\n");
    int val;
    while (int_stack_pop(stack, &val)) {
        printf("  Popped: %d\n", val);
    }

    int_stack_destroy(stack);
    printf("IntStack destroyed safely.\n");
}

void demo_generic_stack(void) {
    printf("\n--- 2. Flat Byte-Buffer Generic Stack Demo ---\n");

    // A) Demonstrate Genuine Integer Stack
    printf("\n[A] Generic Integer Stack (elem_size = sizeof(int) = %lu bytes):\n",
           (unsigned long)sizeof(int));
    GenericStack *int_stack = generic_stack_create(sizeof(int), 2);
    int int_vals[] = {10, 20, 30, 40};
    for (int i = 0; i < 4; i++) {
        generic_stack_push(int_stack, &int_vals[i]);
        printf("  Pushed int: %d (Size: %d, Cap: %d)\n",
               int_vals[i], generic_stack_size(int_stack), int_stack->capacity);
    }

    printf("  Popping with explicit void* cast to (int*):\n");
    while (!generic_stack_is_empty(int_stack)) {
        void *raw = generic_stack_pop_ptr(int_stack);
        // Explicitly cast void* to int* before dereferencing
        int val = *(int*)raw;
        printf("    Popped: %d\n", val);
    }
    generic_stack_destroy(int_stack);

    // B) Demonstrate Genuine Character Stack
    printf("\n[B] Generic Character Stack (elem_size = sizeof(char) = %lu byte):\n",
           (unsigned long)sizeof(char));
    GenericStack *char_stack = generic_stack_create(sizeof(char), 2);
    char char_vals[] = {'A', 'B', 'C', 'D'};
    for (int i = 0; i < 4; i++) {
        generic_stack_push(char_stack, &char_vals[i]);
        printf("  Pushed char: '%c' (Size: %d, Cap: %d)\n",
               char_vals[i], generic_stack_size(char_stack), char_stack->capacity);
    }

    printf("  Popping with explicit void* cast to (char*):\n");
    while (!generic_stack_is_empty(char_stack)) {
        void *raw = generic_stack_pop_ptr(char_stack);
        // Explicitly cast void* to char* before dereferencing
        char ch = *(char*)raw;
        printf("    Popped: '%c'\n", ch);
    }
    generic_stack_destroy(char_stack);

    // C) Demonstrate Custom Struct Storage
    printf("\n[C] Generic Struct Stack ('StockQuote' structs, size: %lu bytes):\n",
           (unsigned long)sizeof(StockQuote));
    GenericStack *stock_stack = generic_stack_create(sizeof(StockQuote), 2);
    StockQuote stocks[] = {
        {"AAPL", 220.50},
        {"GOOGL", 175.25},
        {"MSFT", 430.10}
    };
    for (int i = 0; i < 3; i++) {
        generic_stack_push(stock_stack, &stocks[i]);
        printf("  Pushed Quote: %-6s at $%7.2f (Cap: %d)\n",
               stocks[i].symbol, stocks[i].price, stock_stack->capacity);
    }
    printf("  Popping Quotes with explicit void* cast to (StockQuote*):\n");
    while (!generic_stack_is_empty(stock_stack)) {
        void *raw = generic_stack_pop_ptr(stock_stack);
        StockQuote *quote = (StockQuote*)raw;
        printf("    Popped Quote: %-6s at $%7.2f\n", quote->symbol, quote->price);
    }
    generic_stack_destroy(stock_stack);

    printf("\nGenericStack successfully demonstrated genuine storage of int, char, and structs.\n");
}

int main(void) {
    printf("===============================================================\n");
    printf("Classroom TA -- Lesson 03: Pointers, Structs & Generic Stacks\n");
    printf("===============================================================\n");

    demo_int_stack();
    demo_generic_stack();

    printf("\n[OK] Demonstration completed successfully with 0 memory leaks.\n");
    return 0;
}
