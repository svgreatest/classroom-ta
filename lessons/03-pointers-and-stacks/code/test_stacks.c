#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "int_stack.h"
#include "generic_stack.h"

static int assertions_count = 0;

#define TEST_ASSERT(cond) do { \
    assertions_count++; \
    if (!(cond)) { \
        fprintf(stderr, "FAIL: %s at line %d\n", #cond, __LINE__); \
        exit(1); \
    } \
} while(0)

typedef struct {
    int id;
    char name[16];
    double score;
} StudentRecord;

void test_int_stack(void) {
    printf("[TEST] Testing IntStack (dynamic resizing integer stack)...\n");

    IntStack *s = int_stack_create(2);
    TEST_ASSERT(s != NULL);
    TEST_ASSERT(int_stack_is_empty(s));
    TEST_ASSERT(int_stack_size(s) == 0);

    // Test pushing and capacity expansion
    TEST_ASSERT(int_stack_push(s, 10));
    TEST_ASSERT(int_stack_push(s, 20));
    TEST_ASSERT(s->capacity == 2);
    TEST_ASSERT(int_stack_size(s) == 2);

    // This push must trigger capacity doubling from 2 to 4
    TEST_ASSERT(int_stack_push(s, 30));
    TEST_ASSERT(s->capacity == 4);
    TEST_ASSERT(int_stack_size(s) == 3);

    // Peek test
    int top_val = 0;
    TEST_ASSERT(int_stack_peek(s, &top_val));
    TEST_ASSERT(top_val == 30);
    TEST_ASSERT(int_stack_size(s) == 3);

    // Pop tests (LIFO verification)
    int popped = 0;
    TEST_ASSERT(int_stack_pop(s, &popped));
    TEST_ASSERT(popped == 30);
    TEST_ASSERT(int_stack_size(s) == 2);

    TEST_ASSERT(int_stack_pop(s, &popped));
    TEST_ASSERT(popped == 20);

    TEST_ASSERT(int_stack_pop(s, &popped));
    TEST_ASSERT(popped == 10);

    // Underflow test
    TEST_ASSERT(int_stack_is_empty(s));
    TEST_ASSERT(!int_stack_pop(s, &popped));

    int_stack_destroy(s);
    printf("  ✓ IntStack tests passed successfully.\n");
}

void test_generic_stack_primitives(void) {
    printf("[TEST] Testing GenericStack with primitive types (double, char*)...\n");

    // Generic stack of doubles
    GenericStack *ds = generic_stack_create(sizeof(double), 2);
    TEST_ASSERT(ds != NULL);

    double d1 = 3.14159, d2 = 2.71828, d3 = 1.41421;
    TEST_ASSERT(generic_stack_push(ds, &d1));
    TEST_ASSERT(generic_stack_push(ds, &d2));
    TEST_ASSERT(generic_stack_push(ds, &d3)); // Triggers dynamic resize
    TEST_ASSERT(generic_stack_size(ds) == 3);

    double popped_d = 0.0;
    TEST_ASSERT(generic_stack_pop(ds, &popped_d));
    TEST_ASSERT(popped_d == 1.41421);

    TEST_ASSERT(generic_stack_pop(ds, &popped_d));
    TEST_ASSERT(popped_d == 2.71828);

    TEST_ASSERT(generic_stack_pop(ds, &popped_d));
    TEST_ASSERT(popped_d == 3.14159);

    TEST_ASSERT(generic_stack_is_empty(ds));
    generic_stack_destroy(ds);
    printf("  ✓ GenericStack (double) tests passed successfully.\n");
}

void test_generic_stack_structs(void) {
    printf("[TEST] Testing GenericStack with custom user structs...\n");

    GenericStack *ss = generic_stack_create(sizeof(StudentRecord), 2);
    TEST_ASSERT(ss != NULL);

    StudentRecord r1 = { 101, "Alice", 3.95 };
    StudentRecord r2 = { 102, "Bob",   3.70 };
    StudentRecord r3 = { 103, "Carol", 3.85 };

    TEST_ASSERT(generic_stack_push(ss, &r1));
    TEST_ASSERT(generic_stack_push(ss, &r2));
    TEST_ASSERT(generic_stack_push(ss, &r3));
    TEST_ASSERT(generic_stack_size(ss) == 3);

    StudentRecord out_rec;
    TEST_ASSERT(generic_stack_pop(ss, &out_rec));
    TEST_ASSERT(out_rec.id == 103);
    TEST_ASSERT(strcmp(out_rec.name, "Carol") == 0);
    TEST_ASSERT(out_rec.score == 3.85);

    TEST_ASSERT(generic_stack_pop(ss, &out_rec));
    TEST_ASSERT(out_rec.id == 102);
    TEST_ASSERT(strcmp(out_rec.name, "Bob") == 0);

    TEST_ASSERT(generic_stack_pop(ss, &out_rec));
    TEST_ASSERT(out_rec.id == 101);
    TEST_ASSERT(strcmp(out_rec.name, "Alice") == 0);

    TEST_ASSERT(generic_stack_is_empty(ss));
    generic_stack_destroy(ss);
    printf("  ✓ GenericStack (struct) tests passed successfully.\n");
}

void test_generic_stack_int_and_char_casting(void) {
    printf("[TEST] Testing GenericStack with int and char using void* pop casting...\n");

    // 1. Integer Stack Verification
    GenericStack *is = generic_stack_create(sizeof(int), 2);
    TEST_ASSERT(is != NULL);

    int nums[] = {11, 22, 33};
    for (int i = 0; i < 3; i++) {
        TEST_ASSERT(generic_stack_push(is, &nums[i]));
    }
    TEST_ASSERT(generic_stack_size(is) == 3);

    // Verify popping with explicit void* cast to (int*)
    void *raw_int = generic_stack_pop_ptr(is);
    TEST_ASSERT(raw_int != NULL);
    TEST_ASSERT(*(int*)raw_int == 33);

    raw_int = generic_stack_pop_ptr(is);
    TEST_ASSERT(raw_int != NULL);
    TEST_ASSERT(*(int*)raw_int == 22);

    raw_int = generic_stack_pop_ptr(is);
    TEST_ASSERT(raw_int != NULL);
    TEST_ASSERT(*(int*)raw_int == 11);

    TEST_ASSERT(generic_stack_is_empty(is));
    TEST_ASSERT(generic_stack_pop_ptr(is) == NULL); // Underflow check
    generic_stack_destroy(is);

    // 2. Character Stack Verification
    GenericStack *cs = generic_stack_create(sizeof(char), 2);
    TEST_ASSERT(cs != NULL);

    char letters[] = {'X', 'Y', 'Z'};
    for (int i = 0; i < 3; i++) {
        TEST_ASSERT(generic_stack_push(cs, &letters[i]));
    }
    TEST_ASSERT(generic_stack_size(cs) == 3);

    // Verify popping with explicit void* cast to (char*)
    void *raw_char = generic_stack_pop_ptr(cs);
    TEST_ASSERT(raw_char != NULL);
    TEST_ASSERT(*(char*)raw_char == 'Z');

    raw_char = generic_stack_pop_ptr(cs);
    TEST_ASSERT(raw_char != NULL);
    TEST_ASSERT(*(char*)raw_char == 'Y');

    raw_char = generic_stack_pop_ptr(cs);
    TEST_ASSERT(raw_char != NULL);
    TEST_ASSERT(*(char*)raw_char == 'X');

    TEST_ASSERT(generic_stack_is_empty(cs));
    TEST_ASSERT(generic_stack_pop_ptr(cs) == NULL); // Underflow check
    generic_stack_destroy(cs);

    printf("  ✓ GenericStack (int & char void* casting) tests passed successfully.\n");
}

int main(void) {
    printf("=====================================================\n");
    printf("Classroom TA -- Lesson 03 Stack Verification Suite\n");
    printf("=====================================================\n");

    test_int_stack();
    test_generic_stack_primitives();
    test_generic_stack_int_and_char_casting();
    test_generic_stack_structs();

    printf("\n=====================================================\n");
    printf("ALL TESTS PASSED! Total assertions verified: %d\n", assertions_count);
    printf("=====================================================\n");
    return 0;
}
