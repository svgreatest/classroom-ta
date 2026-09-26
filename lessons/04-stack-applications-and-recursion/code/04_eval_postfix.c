#include <stdio.h>
#include <ctype.h>
#include <stdlib.h>
#include "generic_stack.h"

/**
 * Evaluates a Postfix (RPN) expression using an operand stack.
 */
int evaluate_postfix(const char *expr) {
    GenericStack *s = stack_create(sizeof(int), 32);
    if (!s) return 0;

    for (int i = 0; expr[i] != '\0'; i++) {
        char ch = expr[i];
        if (isspace(ch)) continue;

        if (isdigit(ch)) {
            int val = ch - '0';
            stack_push(s, &val);
        } else if (ch == '+' || ch == '-' || ch == '*' || ch == '/') {
            // Note the critical operand order:
            // Top of stack is the right operand (val2).
            // Second from top is the left operand (val1).
            int val2, val1;
            stack_pop(s, &val2);
            stack_pop(s, &val1);
            int result = 0;

            switch (ch) {
                case '+': result = val1 + val2; break;
                case '-': result = val1 - val2; break;
                case '*': result = val1 * val2; break;
                case '/': result = (val2 != 0) ? (val1 / val2) : 0; break;
            }
            stack_push(s, &result);
        }
    }

    int final_result = 0;
    stack_pop(s, &final_result);
    stack_destroy(s);
    return final_result;
}

int main(void) {
    const char *tests[] = {
        "53+2*",   // (5 + 3) * 2 = 16
        "82/1-",   // (8 / 2) - 1 = 3
        "623+-382/+*" // 6 - (2 + 3) = 1; 3 + (8 / 2) = 7; 1 * 7 = 7
    };
    int count = sizeof(tests) / sizeof(tests[0]);

    printf("=== Postfix Expression Evaluation ===\n");
    for (int i = 0; i < count; i++) {
        printf("Postfix: %-15s -> Evaluated Result: %d\n", tests[i], evaluate_postfix(tests[i]));
    }

    return 0;
}
