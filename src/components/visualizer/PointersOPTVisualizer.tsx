import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  ExternalLink, 
  ArrowLeft,
  BookOpen,
  Code2
} from 'lucide-react';

export interface ExamplePreset {
  id: string;
  title: string;
  category?: 'lesson' | 'gate_quiz';
  code: string;
}

export const EXAMPLES: ExamplePreset[] = [
  // 1. Basic Pointers
  {
    id: 'basics',
    title: '1. Pointer Basics & Dereferencing (& and *)',
    category: 'lesson',
    code: `#include <stdio.h>

int main() {
    int target = 42;
    int *ptr = &target;

    // Direct mutation through dereference
    *ptr = 99;
    printf("Target is now: %d\\n", target);

    int another = 100;
    ptr = &another;
    *ptr = 200;
    printf("Another is now: %d, Target: %d\\n", another, target);
    return 0;
}
`
  },
  {
    id: 'quiz_basics',
    title: 'Concept Check 1: Operator Precedence (*p++, ++*p)',
    category: 'gate_quiz',
    code: `#include <stdio.h>

int main() {
    int a[] = {10, 20, 30, 40, 50};
    int *p = a;

    int x = *p++;   // Step 1: reads *p (10), then increments pointer p
    int y = ++*p;   // Step 2: pre-increments value at *p (20 -> 21)
    int z = *++p;   // Step 3: pre-increments p to &a[2], then dereferences (30)

    printf("x = %d\\n", x);        // 10
    printf("y = %d\\n", y);        // 21
    printf("z = %d\\n", z);        // 30
    printf("a[1] = %d\\n", a[1]);  // 21 (mutated in step 2!)
    return 0;
}
`
  },

  // 2. Pointer Arithmetic
  {
    id: 'pointer_arithmetic',
    title: '2. Pointer Arithmetic & Scaling by sizeof(T)',
    category: 'lesson',
    code: `#include <stdio.h>

int main() {
    int numbers[4] = {100, 200, 300, 400};
    int *p = numbers;

    // Moving pointer forward
    printf("Current: %d\\n", *p); // 100
    p++;
    printf("After p++: %d\\n", *p); // 200
    p += 2;
    printf("After p += 2: %d\\n", *p); // 400

    return 0;
}
`
  },
  {
    id: 'quiz_arithmetic',
    title: 'Concept Check 2: Pointer Subtraction (ptrdiff_t)',
    category: 'gate_quiz',
    code: `#include <stdio.h>
#include <stddef.h>

int main() {
    int a[] = {10, 20, 30, 40, 50, 60};
    int *p1 = a + 1; // points to 20
    int *p2 = a + 4; // points to 50

    // Pointer subtraction gives element count, NOT raw bytes!
    ptrdiff_t diff = p2 - p1;
    int val = *(p1 + diff - 1); // p1 + 3 - 1 = p1 + 2 = a + 3 (40)

    printf("diff (in elements): %td\\n", diff); // 3 (not 12 bytes!)
    printf("val: %d\\n", val);                  // 40
    return 0;
}
`
  },

  // 3. Dynamic Memory Allocation
  {
    id: 'dynamic_memory',
    title: '3. Dynamic Memory (malloc, calloc, realloc & free)',
    category: 'lesson',
    code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // 1. malloc: Allocates uninitialized heap memory
    int *m = (int*)malloc(2 * sizeof(int));
    m[0] = 10;
    m[1] = 20;
    printf("malloc: m[0]=%d, m[1]=%d\\n", m[0], m[1]);

    // 2. calloc: Allocates zero-initialized heap memory
    int *c = (int*)calloc(2, sizeof(int));
    printf("calloc: c[0]=%d, c[1]=%d (zero-cleared!)\\n", c[0], c[1]);
    c[0] = 100;

    // 3. realloc: Expands existing block to 3 ints
    int *resized = (int*)realloc(m, 3 * sizeof(int));
    if (resized != NULL) {
        m = resized;
        m[2] = 30; // Initialize newly allocated slot
        printf("realloc: m[2]=%d\\n", m[2]);
    }

    // 4. free: Release heap memory to avoid leaks
    free(m);
    free(c);
    m = NULL;
    c = NULL;

    return 0;
}
`
  },

  // 4. Double Pointers
  {
    id: 'double_pointers',
    title: '4. Double Pointers (Pointers to Pointers **)',
    category: 'lesson',
    code: `#include <stdio.h>

int main() {
    int val = 42;
    int *ptr = &val;
    int **pptr = &ptr; // Pointer to pointer

    printf("val via **pptr = %d\\n", **pptr);

    // Two-hop dereference mutation
    **pptr = 999;
    printf("val after **pptr = 999 is: %d\\n", val);
    return 0;
}
`
  },
  {
    id: 'quiz_double_pointers',
    title: 'Concept Check 3: Double Pointer Cross-Frame Mutation',
    category: 'gate_quiz',
    code: `#include <stdio.h>

void modify(int **p, int *q) {
    *p = q;       // Mutate the caller's pointer p1 to point to b!
    **p = 40;     // Mutate the target of p1 (which is now b!)
}

int main() {
    int a = 10, b = 20;
    int *p1 = &a;

    modify(&p1, &b);

    printf("a = %d\\n", a);      // 10 (unchanged)
    printf("b = %d\\n", b);      // 40 (mutated via **p)
    printf("*p1 = %d\\n", *p1);  // 40 (p1 points to b)
    return 0;
}
`
  },

  // 5. Arrays & Decay
  {
    id: 'arrays',
    title: '5. Arrays in Memory & Row Pointers',
    category: 'lesson',
    code: `#include <stdio.h>

int main() {
    int arr[3] = {10, 20, 30};
    int *ptr = arr; // Decays to &arr[0]

    printf("arr[0] = %d, *ptr = %d\\n", arr[0], *ptr);

    // Array indexing identity: arr[i] == *(arr + i)
    printf("arr[1] = %d, *(ptr + 1) = %d\\n", arr[1], *(ptr + 1));

    // Mutate via pointer offset
    *(ptr + 2) = 999;
    printf("arr[2] is now: %d\\n", arr[2]);
    return 0;
}
`
  },
  {
    id: 'quiz_arrays',
    title: 'Concept Check 4: 2D Array Pointer Offsets',
    category: 'gate_quiz',
    code: `#include <stdio.h>

int main() {
    int arr[3][4] = {
        {1,  2,  3,  4},
        {5,  6,  7,  8},
        {9, 10, 11, 12}
    };

    int (*ptr)[4] = arr; // Pointer to array of 4 ints
    ptr++;               // Points to row 1 ({5, 6, 7, 8})

    int first = *(*ptr + 2);          // arr[1][2] -> 7
    int second = *(*(ptr + 1) - 1);   // arr[2][0] - 1 int -> arr[1][3] -> 8

    printf("First:  %d\\n", first);   // 7
    printf("Second: %d\\n", second);  // 8
    return 0;
}
`
  },

  // 6. Void Pointers
  {
    id: 'void_pointers',
    title: '6. Void Pointers (void*) & Byte Manipulation',
    category: 'lesson',
    code: `#include <stdio.h>
#include <string.h>

int main() {
    double pi = 3.14159;
    void *vp = &pi; // Untyped address

    // To read: must cast back to typed pointer
    double copy = *(double*)vp;
    printf("Read double: %f\\n", copy);

    // Writing raw bytes via memcpy
    double newVal = 2.71828;
    memcpy(vp, &newVal, sizeof(double));
    printf("Mutated pi is now: %f\\n", pi);
    return 0;
}
`
  },
  {
    id: 'quiz_void_pointers',
    title: 'Concept Check 5: Generic Memory Swap via void* & memcpy',
    category: 'gate_quiz',
    code: `#include <stdio.h>
#include <string.h>

void generic_swap(void *a, void *b, size_t size) {
    char temp[16];
    memcpy(temp, a, size);
    memcpy(a, b, size);
    memcpy(b, temp, size);
}

int main() {
    int arr[] = {10, 20, 30, 40};

    printf("Before swap: %d %d %d %d\\n", arr[0], arr[1], arr[2], arr[3]);
    generic_swap(&arr[1], &arr[3], sizeof(int));
    printf("After swap:  %d %d %d %d\\n", arr[0], arr[1], arr[2], arr[3]);

    return 0;
}
`
  },

  // 7. Dynamic Integer Stack
  {
    id: 'int_stack',
    title: '7. Concrete Dynamic Integer Stack (Cafeteria Plates)',
    category: 'lesson',
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *items;   // Plate holder buffer on heap
    int capacity; // Max capacity
    int top;      // Top plate index
} IntStack;

int main() {
    IntStack s;
    s.capacity = 3;
    s.top = 0;
    s.items = (int*)malloc(s.capacity * sizeof(int));

    // Push plates: 10, 20, 30
    s.items[s.top++] = 10;
    s.items[s.top++] = 20;
    s.items[s.top++] = 30;

    // Pop top plate (LIFO: 30 comes off first!)
    int popped = s.items[--s.top];
    printf("Popped plate: %d\\n", popped); // 30

    // Next popped plate
    int next = s.items[--s.top];
    printf("Next popped:  %d\\n", next);   // 20

    free(s.items);
    return 0;
}
`
  },
  {
    id: 'quiz_int_stack',
    title: 'Concept Check 6: Stack Permutation Validity (1..5)',
    category: 'gate_quiz',
    code: `#include <stdio.h>

// Question: Push elements 1, 2, 3, 4, 5 in order.
// Can we generate output: 1, 5, 2, 4, 3?
// Let's trace it:
// 1. push(1) -> pop() yields 1. (Stack empty)
// 2. To get 5 next: must push 2, 3, 4, 5.
// 3. pop() yields 5. (Stack now has top -> 4, 3, 2)
// 4. Can we get 2 next? NO! 4 is on top, followed by 3.
//    Popping 2 before 4 and 3 violates LIFO!

int main() {
    printf("Validating sequence: 1, 5, 2, 4, 3\\n");
    printf("Status: IMPOSSIBLE under LIFO Stack operations!\\n");
    return 0;
}
`
  },

  // 8. Generic Stack
  {
    id: 'generic_stack',
    title: '8. Genuine Generic Stack (int & char with void* cast)',
    category: 'lesson',
    code: `#include <stdio.h>
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
    printf("--- 1. Generic Integer Stack (int) ---\\n");
    GenericStack *int_stack = create_stack(sizeof(int), 3);

    int n1 = 10, n2 = 20, n3 = 30;
    push(int_stack, &n1);
    push(int_stack, &n2);
    push(int_stack, &n3);

    while (int_stack->top > 0) {
        void *raw = pop(int_stack);
        // Cast void* to int* before dereferencing
        int val = *(int*)raw;
        printf("Popped int: %d\\n", val);
    }

    // ==============================================================
    // 2. GENUINE CHARACTER STACK (elem_size = sizeof(char) = 1 byte)
    // ==============================================================
    printf("\\n--- 2. Generic Character Stack (char) ---\\n");
    GenericStack *char_stack = create_stack(sizeof(char), 3);

    char c1 = 'A', c2 = 'B', c3 = 'C';
    push(char_stack, &c1);
    push(char_stack, &c2);
    push(char_stack, &c3);

    while (char_stack->top > 0) {
        void *raw = pop(char_stack);
        // Cast void* to char* before dereferencing
        char ch = *(char*)raw;
        printf("Popped char: '%c'\\n", ch);
    }

    // Clean up heap memory
    free_stack(int_stack);
    free_stack(char_stack);
    return 0;
}
`
  },
  {
    id: 'quiz_generic_stack',
    title: 'Practice Challenge: Generic Stack Byte Offset & Endianness',
    category: 'gate_quiz',
    code: `#include <stdio.h>
#include <string.h>

int main() {
    char buffer[16] = {0};
    void *stack_elems = buffer;
    size_t elem_size = sizeof(int); // 4 bytes
    int top = 2;

    // Push 0xAABBCCDD at top = 2
    int val = 0xAABBCCDD;
    char *target = (char*)stack_elems + (top * elem_size); // offset 8
    memcpy(target, &val, elem_size);

    // On little-endian architecture:
    // buffer[8]  = 0xDD (least significant byte)
    // buffer[9]  = 0xCC
    // buffer[10] = 0xBB
    // buffer[11] = 0xAA
    printf("Byte at buffer[8]: 0x%02X\\n", (unsigned char)buffer[8]);
    return 0;
}
`
  },

  // 8. Swap
  {
    id: 'swap',
    title: '8. Motivating Swap: Crossing Stack Frames',
    category: 'lesson',
    code: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10;
    int y = 20;
    swap(&x, &y);
    printf("After swap: x = %d, y = %d\\n", x, y);
    return 0;
}
`
  },

  // ==============================================================
  // LESSON 04: STACK APPLICATIONS & RECURSION (GENERIC STACK ADT)
  // ==============================================================
  {
    id: 'reverse_list',
    title: 'L4.1 Reversing Sequences with GenericStack ADT',
    category: 'lesson',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Production GenericStack ADT (built in Lesson 3)
typedef struct {
    void *elems;
    size_t elem_size;
    int capacity;
    int top;
} GenericStack;

GenericStack* stack_create(size_t elem_size, int cap) {
    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    s->elem_size = elem_size;
    s->capacity = cap;
    s->top = 0;
    s->elems = malloc(cap * elem_size);
    return s;
}

void stack_push(GenericStack *s, const void *val) {
    char *dest = (char*)s->elems + (s->top * s->elem_size);
    memcpy(dest, val, s->elem_size);
    s->top++;
}

bool stack_pop(GenericStack *s, void *out_val) {
    if (s->top == 0) return false;
    s->top--;
    char *src = (char*)s->elems + (s->top * s->elem_size);
    memcpy(out_val, src, s->elem_size);
    return true;
}

void stack_destroy(GenericStack *s) {
    free(s->elems);
    free(s);
}

// Client application consumes only public ADT methods
int main() {
    int list[5] = {10, 20, 30, 40, 50};
    GenericStack *s = stack_create(sizeof(int), 5);

    // Phase 1: Push elements (temporal ordering)
    for (int i = 0; i < 5; i++) {
        stack_push(s, &list[i]);
    }

    // Phase 2: Pop elements (inverted LIFO ordering)
    for (int i = 0; i < 5; i++) {
        stack_pop(s, &list[i]);
    }

    stack_destroy(s);
    return 0; // Inspect reversed 'list' in memory view
}
`
  },
  {
    id: 'parentheses_checker',
    title: 'L4.2 Parentheses Validator via GenericStack ADT',
    category: 'lesson',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

typedef struct {
    void *elems;
    size_t elem_size;
    int capacity;
    int top;
} GenericStack;

GenericStack* stack_create(size_t elem_size, int cap) {
    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    s->elem_size = elem_size;
    s->capacity = cap;
    s->top = 0;
    s->elems = malloc(cap * elem_size);
    return s;
}

void stack_push(GenericStack *s, const void *val) {
    char *dest = (char*)s->elems + (s->top * s->elem_size);
    memcpy(dest, val, s->elem_size);
    s->top++;
}

bool stack_pop(GenericStack *s, void *out_val) {
    if (s->top == 0) return false;
    s->top--;
    char *src = (char*)s->elems + (s->top * s->elem_size);
    memcpy(out_val, src, s->elem_size);
    return true;
}

bool check_parentheses(const char *str) {
    GenericStack *s = stack_create(sizeof(char), 16);

    for (int i = 0; str[i] != '\\0'; i++) {
        char ch = str[i];
        if (ch == '(' || ch == '{' || ch == '[') {
            stack_push(s, &ch);
        } else if (ch == ')' || ch == '}' || ch == ']') {
            char top;
            if (!stack_pop(s, &top)) {
                free(s->elems); free(s);
                return false; // Underflow
            }
            if ((ch == ')' && top != '(') ||
                (ch == '}' && top != '{') ||
                (ch == ']' && top != '[')) {
                free(s->elems); free(s);
                return false; // Mismatch
            }
        }
    }
    bool balanced = (s->top == 0);
    free(s->elems); free(s);
    return balanced;
}

int main() {
    bool valid = check_parentheses("{[()]}");
    bool invalid = check_parentheses("[(])");
    printf("Valid check: %d, Invalid check: %d\\n", valid, invalid);
    return 0;
}
`
  },
  {
    id: 'eval_postfix',
    title: 'L4.3 Postfix (RPN) Evaluation via GenericStack ADT',
    category: 'lesson',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

typedef struct {
    void *elems;
    size_t elem_size;
    int capacity;
    int top;
} GenericStack;

GenericStack* stack_create(size_t elem_size, int cap) {
    GenericStack *s = (GenericStack*)malloc(sizeof(GenericStack));
    s->elem_size = elem_size;
    s->capacity = cap;
    s->top = 0;
    s->elems = malloc(cap * elem_size);
    return s;
}

void stack_push(GenericStack *s, const void *val) {
    char *dest = (char*)s->elems + (s->top * s->elem_size);
    memcpy(dest, val, s->elem_size);
    s->top++;
}

bool stack_pop(GenericStack *s, void *out_val) {
    if (s->top == 0) return false;
    s->top--;
    char *src = (char*)s->elems + (s->top * s->elem_size);
    memcpy(out_val, src, s->elem_size);
    return true;
}

int eval_postfix(const char *expr) {
    GenericStack *s = stack_create(sizeof(int), 16);

    for (int i = 0; expr[i] != '\\0'; i++) {
        char ch = expr[i];
        if (isdigit(ch)) {
            int val = ch - '0';
            stack_push(s, &val);
        } else if (ch == '+' || ch == '-' || ch == '*' || ch == '/') {
            int val2, val1;
            stack_pop(s, &val2); // Right operand
            stack_pop(s, &val1); // Left operand
            int res = 0;
            if (ch == '+') res = val1 + val2;
            else if (ch == '-') res = val1 - val2;
            else if (ch == '*') res = val1 * val2;
            else if (ch == '/') res = (val2 != 0) ? (val1 / val2) : 0;
            stack_push(s, &res);
        }
    }
    int ans = 0;
    stack_pop(s, &ans);
    free(s->elems); free(s);
    return ans;
}

int main() {
    // (5 + 3) * 2 = 16
    char expr[] = "53+2*";
    int ans = eval_postfix(expr);
    printf("Result of %s = %d\\n", expr, ans);
    return 0;
}
`
  },
  {
    id: 'infix_to_postfix',
    title: 'L4.4 Infix to Postfix Conversion (Shunting-Yard)',
    category: 'lesson',
    code: `#include <stdio.h>
#include <ctype.h>

int prec(char c) {
    if (c == '^') return 3;
    if (c == '*' || c == '/') return 2;
    if (c == '+' || c == '-') return 1;
    return -1;
}

int main() {
    char infix[] = "A+B*(C-D)";
    char postfix[50];
    char stack[50];
    int top = -1, k = 0;

    for (int i = 0; infix[i] != '\\0'; i++) {
        char ch = infix[i];
        if (isalnum(ch)) {
            postfix[k++] = ch;
        } else if (ch == '(') {
            stack[++top] = ch;
        } else if (ch == ')') {
            while (top != -1 && stack[top] != '(')
                postfix[k++] = stack[top--];
            top--; // Discard '('
        } else {
            while (top != -1 && prec(stack[top]) >= prec(ch))
                postfix[k++] = stack[top--];
            stack[++top] = ch;
        }
    }
    while (top != -1) postfix[k++] = stack[top--];
    postfix[k] = '\\0';

    printf("Infix:   %s\\nPostfix: %s\\n", infix, postfix);
    return 0;
}
`
  },
  {
    id: 'prefix_ops',
    title: 'L4.5 Prefix Evaluation & Conversion Duality',
    category: 'lesson',
    code: `#include <stdio.h>
#include <string.h>
#include <ctype.h>

// Prefix Evaluation via Right-to-Left Scanning
int eval_prefix(const char *expr) {
    int stack[50];
    int top = -1;
    int len = strlen(expr);

    for (int i = len - 1; i >= 0; i--) {
        char ch = expr[i];
        if (isdigit(ch)) {
            stack[++top] = ch - '0';
        } else if (ch == '+' || ch == '-' || ch == '*') {
            // Notice: val1 is left operand, val2 is right operand
            int val1 = stack[top--];
            int val2 = stack[top--];
            int res = 0;
            if (ch == '+') res = val1 + val2;
            else if (ch == '-') res = val1 - val2;
            else if (ch == '*') res = val1 * val2;
            stack[++top] = res;
        }
    }
    return stack[top];
}

int main() {
    // - + 5 3 * 2 4 => (5 + 3) - (2 * 4) = 8 - 8 = 0
    char prefix[] = "-+53*24";
    int ans = eval_prefix(prefix);
    printf("Prefix eval %s = %d\\n", prefix, ans);
    return 0;
}
`
  },
  {
    id: 'recursion_callstack',
    title: 'L4.6 Recursion & Call Stack Activation Records',
    category: 'lesson',
    code: `#include <stdio.h>

int factorial(int n) {
    // Step through to watch stack frames push and pop!
    if (n <= 1) {
        return 1; // Base case: frame unwind starts
    }
    int sub = factorial(n - 1); // New stack frame created
    return n * sub;
}

int main() {
    int val = 4;
    int result = factorial(val);
    printf("factorial(%d) = %d\\n", val, result);
    return 0;
}
`
  },
  {
    id: 'tower_of_hanoi',
    title: 'L4.7 Tower of Hanoi Recursive Tree Trace',
    category: 'lesson',
    code: `#include <stdio.h>

void hanoi(int n, char from, char to, char aux) {
    if (n == 0) return;
    // Step 1: Move n-1 disks to auxiliary
    hanoi(n - 1, from, aux, to);
    // Step 2: Move largest disk to destination
    printf("Move disk %d: %c -> %c\\n", n, from, to);
    // Step 3: Move n-1 disks from auxiliary to destination
    hanoi(n - 1, aux, to, from);
}

int main() {
    int n = 3;
    printf("Solving Tower of Hanoi for n = %d\\n", n);
    hanoi(n, 'A', 'C', 'B');
    return 0;
}
`
  }
];

// Lesson demos (lessons/<id>/tutor/*.c) come first and replace built-in presets with the same id.
export function mergeExamples(lessonExamples: ExamplePreset[], builtIn: ExamplePreset[] = EXAMPLES): ExamplePreset[] {
  const lessonIds = new Set(lessonExamples.map(x => x.id));
  return [...lessonExamples, ...builtIn.filter(x => !lessonIds.has(x.id))];
}

interface PointersOPTVisualizerProps {
  lessonId?: string;
  selectedExampleId?: string;
  onSelectExampleId?: (id: string) => void;
  returnToSlideNumber?: number;
  onReturnToSlides?: () => void;
}

export const PointersOPTVisualizer: React.FC<PointersOPTVisualizerProps> = ({
  selectedExampleId,
  onSelectExampleId,
  returnToSlideNumber,
  onReturnToSlides,
  lessonId
}) => {
  const [examples, setExamples] = useState<ExamplePreset[]>(EXAMPLES);
  const [selectedExample, setSelectedExample] = useState<ExamplePreset>(() => {
    if (selectedExampleId) {
      const found = EXAMPLES.find(x => x.id === selectedExampleId);
      if (found) return found;
    }
    return EXAMPLES[0];
  });
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    fetch(`/api/tutor-examples?lessonId=${encodeURIComponent(lessonId)}`)
      .then(res => (res.ok ? res.json() : { examples: [] }))
      .then(data => {
        if (!cancelled) setExamples(mergeExamples(data.examples || []));
      })
      .catch(() => {
        if (!cancelled) setExamples(EXAMPLES);
      });
    return () => { cancelled = true; };
  }, [lessonId]);

  // Synchronize when parent passes updated selectedExampleId, or when lesson demos arrive
  useEffect(() => {
    if (selectedExampleId) {
      const found = examples.find(x => x.id === selectedExampleId);
      if (found && (found.id !== selectedExample.id || found.code !== selectedExample.code)) {
        setSelectedExample(found);
        setIframeKey(prev => prev + 1);
      }
    }
  }, [selectedExampleId, examples]);

  const handleSelectExample = (preset: ExamplePreset) => {
    setSelectedExample(preset);
    setIframeKey(prev => prev + 1);
    if (onSelectExampleId) {
      onSelectExampleId(preset.id);
    }
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const tutorUrl = `/opt-tutor/c.html#code=${encodeURIComponent(selectedExample.code)}&curInstr=0`;

  return (
    <div className="h-full w-full flex flex-col bg-[#181816] text-[#faf6ee] overflow-hidden">
      {/* Sleek, Focused Top Toolbar with Return to Slide Button */}
      <header className="h-12 bg-[#141413] border-b border-[#383733] px-3 lg:px-4 flex items-center justify-between gap-3 select-none shrink-0 z-10">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Prominent Return to Slide Button */}
          {onReturnToSlides && (
            <button
              onClick={onReturnToSlides}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#cc785c] hover:bg-[#d98266] text-[#181816] transition shadow-md font-sans shrink-0 cursor-pointer"
              title="Return to Slide Presentation"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Return to Slide{returnToSlideNumber ? ` ${returnToSlideNumber}` : ''}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 border-l border-[#383733] pl-3">
            <span className="text-xs font-bold text-[#faf6ee] font-serif-anthropic tracking-wide">
              Online Python Tutor (C Memory Visualizer)
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
              LOCAL BACKEND
            </span>
          </div>
        </div>

        {/* Example Selector Dropdown & Quick Actions */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#9e978c] font-medium hidden md:inline">
            Active Demo:
          </label>
          <select
            value={selectedExample.id}
            onChange={(e) => {
              const found = examples.find(x => x.id === e.target.value);
              if (found) handleSelectExample(found);
            }}
            className="bg-[#22221f] text-[#faf6ee] border border-[#383733] hover:border-[#cc785c] rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none transition cursor-pointer max-w-[220px] sm:max-w-[320px] truncate"
          >
            <optgroup label="Lesson Demonstrations">
              {examples.filter(ex => ex.category !== 'gate_quiz').map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Understanding Checks">
              {examples.filter(ex => ex.category === 'gate_quiz').map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22221f] hover:bg-[#2a2a26] text-[#d4cfc5] border border-[#383733] hover:border-[#cc785c] transition shadow-sm font-sans"
            title="Reset code in tutor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href={tutorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-[#22221f] text-[#9e978c] hover:text-[#faf6ee] border border-[#383733] hover:border-[#cc785c] transition"
            title="Open Fullscreen in New Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* 100% Full-Width Focused Editor & Visualizer Canvas */}
      <main className="flex-1 w-full h-full bg-[#faf6ee] relative overflow-hidden">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={tutorUrl}
          title="Online Python Tutor C Visualizer"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </main>
    </div>
  );
};
