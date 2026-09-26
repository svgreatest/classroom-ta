#include <stdio.h>
#include <ctype.h>
#include <string.h>
#include "generic_stack.h"

#define MAX_BUFFER 256

static int get_precedence(char op) {
    switch (op) {
        case '^': return 3;
        case '*':
        case '/': return 2;
        case '+':
        case '-': return 1;
        default:  return 0;
    }
}

/**
 * Converts an Infix expression to Postfix (RPN) using Dijkstra's Shunting-Yard algorithm.
 */
void infix_to_postfix(const char *infix, char *postfix) {
    GenericStack *op_stack = stack_create(sizeof(char), 32);
    if (!op_stack) return;

    int out_idx = 0;

    for (int i = 0; infix[i] != '\0'; i++) {
        char ch = infix[i];
        if (isspace(ch)) continue;

        // 1. Operands are immediately emitted to output
        if (isalnum(ch)) {
            postfix[out_idx++] = ch;
        }
        // 2. Left parenthesis opens a new isolated scope
        else if (ch == '(') {
            stack_push(op_stack, &ch);
        }
        // 3. Right parenthesis pops operators until matching '('
        else if (ch == ')') {
            char top_op;
            while (!stack_is_empty(op_stack) && stack_peek(op_stack, &top_op) && top_op != '(') {
                stack_pop(op_stack, &top_op);
                postfix[out_idx++] = top_op;
            }
            // Discard opening '('
            if (!stack_is_empty(op_stack)) {
                stack_pop(op_stack, &top_op);
            }
        }
        // 4. Operator: pop while top operator has higher or equal precedence (left-associative)
        else {
            char top_op;
            while (!stack_is_empty(op_stack) && stack_peek(op_stack, &top_op) &&
                   top_op != '(' && get_precedence(top_op) >= get_precedence(ch)) {
                stack_pop(op_stack, &top_op);
                postfix[out_idx++] = top_op;
            }
            stack_push(op_stack, &ch);
        }
    }

    // 5. Drain remaining operators
    char top_op;
    while (stack_pop(op_stack, &top_op)) {
        postfix[out_idx++] = top_op;
    }
    postfix[out_idx] = '\0';

    stack_destroy(op_stack);
}

int main(void) {
    const char *expressions[] = {
        "A + B * C",
        "(A + B) * C",
        "A + B * (C - D) / E",
        "A * B + C * D - E"
    };
    int count = sizeof(expressions) / sizeof(expressions[0]);

    printf("=== Infix to Postfix (Shunting-Yard) ===\n");
    for (int i = 0; i < count; i++) {
        char postfix[MAX_BUFFER];
        infix_to_postfix(expressions[i], postfix);
        printf("Infix:   %-25s -> Postfix: %s\n", expressions[i], postfix);
    }

    return 0;
}
