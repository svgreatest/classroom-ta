#include <stdio.h>
#include <string.h>
#include <ctype.h>
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

static void reverse_string(char *str) {
    int len = (int)strlen(str);
    for (int i = 0; i < len / 2; i++) {
        char temp = str[i];
        str[i] = str[len - 1 - i];
        str[len - 1 - i] = temp;
    }
}

/**
 * Converts Infix to Prefix using reversal duality and the Generic Stack ADT.
 * Pipeline: Reverse Infix -> Invert Parens -> Modified Shunting Yard -> Reverse Output
 */
void infix_to_prefix(const char *infix, char *prefix) {
    char rev_infix[MAX_BUFFER];
    strcpy(rev_infix, infix);
    reverse_string(rev_infix);

    // Swap '(' and ')'
    for (int i = 0; rev_infix[i] != '\0'; i++) {
        if (rev_infix[i] == '(') rev_infix[i] = ')';
        else if (rev_infix[i] == ')') rev_infix[i] = '(';
    }

    GenericStack *op_stack = stack_create(sizeof(char), 32);
    char rev_postfix[MAX_BUFFER];
    int out_idx = 0;

    for (int i = 0; rev_infix[i] != '\0'; i++) {
        char ch = rev_infix[i];
        if (isspace(ch)) continue;

        if (isalnum(ch)) {
            rev_postfix[out_idx++] = ch;
        } else if (ch == '(') {
            stack_push(op_stack, &ch);
        } else if (ch == ')') {
            char top_op;
            while (!stack_is_empty(op_stack) && stack_peek(op_stack, &top_op) && top_op != '(') {
                stack_pop(op_stack, &top_op);
                rev_postfix[out_idx++] = top_op;
            }
            if (!stack_is_empty(op_stack)) {
                stack_pop(op_stack, &top_op); // Discard '('
            }
        } else {
            // Note: Strictly greater precedence check for prefix associativity symmetry
            char top_op;
            while (!stack_is_empty(op_stack) && stack_peek(op_stack, &top_op) &&
                   top_op != '(' && get_precedence(top_op) > get_precedence(ch)) {
                stack_pop(op_stack, &top_op);
                rev_postfix[out_idx++] = top_op;
            }
            stack_push(op_stack, &ch);
        }
    }

    char top_op;
    while (stack_pop(op_stack, &top_op)) {
        rev_postfix[out_idx++] = top_op;
    }
    rev_postfix[out_idx] = '\0';
    stack_destroy(op_stack);

    // Final reversal gives Prefix
    strcpy(prefix, rev_postfix);
    reverse_string(prefix);
}

int main(void) {
    const char *expressions[] = {
        "A + B * C",
        "(A + B) * C",
        "(A + B) * C - D"
    };
    int count = sizeof(expressions) / sizeof(expressions[0]);

    printf("=== Infix to Prefix Conversion ===\n");
    for (int i = 0; i < count; i++) {
        char prefix[MAX_BUFFER];
        infix_to_prefix(expressions[i], prefix);
        printf("Infix:  %-20s -> Prefix: %s\n", expressions[i], prefix);
    }

    return 0;
}
