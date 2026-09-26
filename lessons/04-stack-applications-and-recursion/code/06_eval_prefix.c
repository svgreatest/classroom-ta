#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
#include "generic_stack.h"

/**
 * Evaluates a Prefix (Polish) expression by scanning from Right to Left.
 */
int evaluate_prefix(const char *expr) {
    GenericStack *s = stack_create(sizeof(int), 32);
    if (!s) return 0;

    int len = (int)strlen(expr);

    // Scan RIGHT to LEFT
    for (int i = len - 1; i >= 0; i--) {
        char ch = expr[i];
        if (isspace(ch)) continue;

        if (isdigit(ch)) {
            int val = ch - '0';
            stack_push(s, &val);
        } else if (ch == '+' || ch == '-' || ch == '*' || ch == '/') {
            // In right-to-left scan:
            // Top of stack is the left operand (val1)
            // Second from top is the right operand (val2)
            int val1, val2;
            stack_pop(s, &val1);
            stack_pop(s, &val2);
            int res = 0;

            switch (ch) {
                case '+': res = val1 + val2; break;
                case '-': res = val1 - val2; break;
                case '*': res = val1 * val2; break;
                case '/': res = (val2 != 0) ? (val1 / val2) : 0; break;
            }
            stack_push(s, &res);
        }
    }

    int final_result = 0;
    stack_pop(s, &final_result);
    stack_destroy(s);
    return final_result;
}

int main(void) {
    const char *expressions[] = {
        "-+53*24",  // (5 + 3) - (2 * 4) = 8 - 8 = 0
        "*+234",    // (2 + 3) * 4 = 20
        "-/821"     // (8 / 2) - 1 = 3
    };
    int count = sizeof(expressions) / sizeof(expressions[0]);

    printf("=== Prefix Expression Evaluation (Right-to-Left Scan) ===\n");
    for (int i = 0; i < count; i++) {
        printf("Prefix: %-15s -> Evaluated Result: %d\n", expressions[i], evaluate_prefix(expressions[i]));
    }

    return 0;
}
