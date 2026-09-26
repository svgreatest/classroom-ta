#include <stdio.h>
#include <stdbool.h>
#include "generic_stack.h"

static bool is_matching_pair(char open, char close) {
    if (open == '(' && close == ')') return true;
    if (open == '{' && close == '}') return true;
    if (open == '[' && close == ']') return true;
    return false;
}

/**
 * Validates balanced parentheses and brackets in an expression string.
 */
bool check_parentheses(const char *expr) {
    GenericStack *s = stack_create(sizeof(char), 16);
    if (!s) return false;

    for (int i = 0; expr[i] != '\0'; i++) {
        char ch = expr[i];

        // Opening bracket: Push
        if (ch == '(' || ch == '{' || ch == '[') {
            stack_push(s, &ch);
        }
        // Closing bracket: Pop and match
        else if (ch == ')' || ch == '}' || ch == ']') {
            char top;
            // Failure mode 1: Underflow (closing without opener)
            if (!stack_pop(s, &top)) {
                stack_destroy(s);
                return false;
            }
            // Failure mode 2: Mismatch (closer does not match opener)
            if (!is_matching_pair(top, ch)) {
                stack_destroy(s);
                return false;
            }
        }
    }

    // Failure mode 3: Leftover unclosed openers
    bool balanced = stack_is_empty(s);
    stack_destroy(s);
    return balanced;
}

int main(void) {
    const char *cases[] = {
        "{[()]}",       // Valid
        "[(])",         // Invalid (crossed nesting)
        "((())",        // Invalid (unclosed opener)
        "())",          // Invalid (underflow)
        "{a + [b * (c + d)]}" // Valid embedded in math
    };
    int num_cases = sizeof(cases) / sizeof(cases[0]);

    printf("=== Parentheses Validation ===\n");
    for (int i = 0; i < num_cases; i++) {
        printf("Expression: %-25s -> %s\n", cases[i],
               check_parentheses(cases[i]) ? "VALID" : "INVALID");
    }

    return 0;
}
