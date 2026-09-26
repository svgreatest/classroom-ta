/**
 * ==============================================================================
 * Classroom TA - Stack Applications & Recursion Case Study
 * File: calculator.c
 *
 * Description:
 *   An arithmetic expression evaluator implementing Dijkstra's Shunting-Yard
 *   Algorithm to convert Infix expressions to Postfix (Reverse Polish Notation),
 *   followed by Postfix stack evaluation.
 *
 * Algorithm Overview:
 *   1. Infix Notation (Human readable, e.g. "(2 + 3) * 4 - 6 / 2"):
 *      Requires operator precedence (PEMDAS) and parentheses grouping.
 *   2. Dijkstra's Train Yard Metaphor (Shunting-Yard):
 *      - Main Line (Output): Numbers bypass the yard directly onto the output line.
 *      - Siding Spur (Operator Stack): Operators divert onto a LIFO spur.
 *      - Precedence Rules: Higher-priority operators park on top; when a lower-
 *        priority operator arrives, cars on the spur back out onto the main line.
 *      - Parentheses: '(' acts as a boundary barrier; ')' flushes all operators
 *        back to the barrier, then discards the parentheses.
 *   3. Postfix Evaluation (Computer executable, e.g. "2 3 + 4 * 6 2 / -"):
 *      Reads left-to-right. Pushes numbers to an evaluation stack. When an
 *      operator arrives, pops the top 2 operands (right operand first, then left),
 *      computes the result, and pushes it back onto the stack.
 *
 * Features:
 *   - Multi-digit integer parsing.
 *   - Unary negation handling (e.g. leading '-5').
 *   - Parentheses nesting verification.
 *   - Precedence: '^' (level 3) > '*', '/' (level 2) > '+', '-' (level 1).
 *   - Associativity: Right-associative '^' (e.g., 2^3^2 = 2^(3^2) = 512),
 *                   Left-associative for '+', '-', '*', '/'.
 *   - Detailed step-by-step diagnostic logging written directly to "calculator.log"
 *     to preserve screen rendering on stdout.
 * ==============================================================================
 */

#include "calculator.h"
#include "generic_stack.h"
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CALCULATOR_LOG_FILE "calculator.log"

/**
 * Returns the numerical precedence level of an arithmetic operator.
 * Higher number indicates higher binding precedence:
 *   Level 3: Exponentiation (^)
 *   Level 2: Multiplication (*), Division (/)
 *   Level 1: Addition (+), Subtraction (-)
 *   Level 0: Non-operator / Parenthesis barrier
 */
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
 * Determines operator associativity.
 *   - Exponentiation (^) is right-associative: 2 ^ 3 ^ 2 evaluated as 2 ^ (3 ^ 2).
 *   - Addition, subtraction, multiplication, and division are left-associative.
 */
static bool is_right_associative(char op) {
    return (op == '^');
}

/**
 * Integer power calculation (base^exp).
 * Handles non-negative integer exponents.
 */
static int int_pow(int base, int exp) {
    int res = 1;
    for (int i = 0; i < exp; i++) {
        res *= base;
    }
    return res;
}

/**
 * Token representation for the compiled Postfix stream.
 */
typedef enum {
    TOK_NUMBER,   /* Integer literal operand */
    TOK_OPERATOR  /* Arithmetic operator character (+, -, *, /, ^) */
} TokenType;

typedef struct {
    TokenType type;
    int value;    /* Valid if type == TOK_NUMBER */
    char op;      /* Valid if type == TOK_OPERATOR */
} Token;

/**
 * Helper to display the compiled Postfix token stream in log file.
 */
static void log_postfix_tokens(FILE *log_fp, const Token *tokens, int count) {
    if (!log_fp) return;
    fprintf(log_fp, "[Calculator]   Compiled Postfix Stream: [ ");
    for (int i = 0; i < count; i++) {
        if (tokens[i].type == TOK_NUMBER) {
            fprintf(log_fp, "%d ", tokens[i].value);
        } else {
            fprintf(log_fp, "%c ", tokens[i].op);
        }
    }
    fprintf(log_fp, "]\n");
}

/**
 * Main evaluation entry point:
 * Parses an infix arithmetic expression, compiles it to postfix tokens using
 * Dijkstra's Shunting-Yard algorithm, evaluates the postfix stream using an
 * evaluation stack, and writes detailed trace logs to "calculator.log" without
 * disturbing stdout.
 */
bool calculator_eval(const char *infix_expr, int *out_result, char *err_buf, size_t err_size) {
    /* Open log file afresh in write mode */
    FILE *log_fp = fopen(CALCULATOR_LOG_FILE, "w");

    /* -------------------------------------------------------------------------
     * Argument Validation
     * ------------------------------------------------------------------------- */
    if (!infix_expr || !out_result) {
        if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Null pointer argument");
        if (log_fp) {
            fprintf(log_fp, "[Calculator] [Error] Null pointer argument provided\n");
            fclose(log_fp);
        }
        return false;
    }

    if (log_fp) {
        fprintf(log_fp, "\n======================================================================\n");
        fprintf(log_fp, "[Calculator] Evaluating Infix Expression: \"%s\"\n", infix_expr);
        fprintf(log_fp, "======================================================================\n");
        fprintf(log_fp, "[Calculator] --- Step 1: Shunting-Yard Compilation (Infix -> Postfix) ---\n");
    }

    /* -------------------------------------------------------------------------
     * Step 1: Shunting-Yard Infix to Postfix Token Compilation
     * ------------------------------------------------------------------------- */
    Token postfix[256];
    int postfix_count = 0;

    /* Operator stack stores operator characters and '(' parenthesis markers */
    GenericStack *op_stack = stack_create(sizeof(char), 32);
    const char *p = infix_expr;
    bool expect_operand = true;

    while (*p) {
        /* Skip whitespace characters */
        if (isspace((unsigned char)*p)) {
            p++;
            continue;
        }

        /* 1A. Numerical Operand */
        if (isdigit((unsigned char)*p)) {
            int val = 0;
            while (isdigit((unsigned char)*p)) {
                val = val * 10 + (*p - '0'); 
                p++;
            }
            if (postfix_count >= 256) {
                if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Expression too complex (token limit)");
                if (log_fp) {
                    fprintf(log_fp, "[Calculator] [Error] Token capacity exceeded (max 256 tokens)\n");
                    fclose(log_fp);
                }
                stack_destroy(op_stack);
                return false;
            }
            postfix[postfix_count].type = TOK_NUMBER;
            postfix[postfix_count].value = val;
            postfix[postfix_count].op = 0;
            postfix_count++;

            if (log_fp) {
                fprintf(log_fp, "[Calculator]   [Operand] %-5d -> Emitted directly to Postfix output (Main Line)\n", val);
            }
            expect_operand = false;
        }
        /* 1B. Left Parenthesis '(' - Subexpression Scope Start */
        else if (*p == '(') {
            char lparen = '(';
            stack_push(op_stack, &lparen);
            if (log_fp) {
                fprintf(log_fp, "[Calculator]   [Paren]   '('   -> Pushed to Operator Stack (Scope Boundary)\n");
            }
            p++;
            expect_operand = true;
        }
        /* 1C. Right Parenthesis ')' - Pop Until Matching '(' */
        else if (*p == ')') {
            if (log_fp) {
                fprintf(log_fp, "[Calculator]   [Paren]   ')'   -> Unwinding Operator Stack to matching '('\n");
            }
            char top_op;
            bool found_lparen = false;
            while (stack_pop(op_stack, &top_op)) {
                if (top_op == '(') {
                    found_lparen = true;
                    break;
                }
                if (postfix_count >= 256) {
                    if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Token limit exceeded");
                    if (log_fp) {
                        fprintf(log_fp, "[Calculator] [Error] Token capacity exceeded\n");
                        fclose(log_fp);
                    }
                    stack_destroy(op_stack);
                    return false;
                }
                postfix[postfix_count].type = TOK_OPERATOR;
                postfix[postfix_count].op = top_op;
                postfix_count++;
                if (log_fp) {
                    fprintf(log_fp, "[Calculator]             Popped '%c' from stack -> Appended to Postfix output\n", top_op);
                }
            }
            if (!found_lparen) {
                if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Syntax Error: Unmatched closing ')'");
                if (log_fp) {
                    fprintf(log_fp, "[Calculator] [Error] Syntax Error: Unmatched closing ')' without '('!\n");
                    fclose(log_fp);
                }
                stack_destroy(op_stack);
                return false;
            }
            if (log_fp) {
                fprintf(log_fp, "[Calculator]             Matched and discarded '('\n");
            }
            p++;
            expect_operand = false;
        }
        /* 1D. Arithmetic Operators (+, -, *, /, ^) */
        else if (*p == '+' || *p == '-' || *p == '*' || *p == '/' || *p == '^') {
            /* Handle unary negation by converting "-x" into "(0 - x)" */
            if (expect_operand && *p == '-') {
                if (log_fp) {
                    fprintf(log_fp, "[Calculator]   [Unary]   '-'   -> Detected unary negation; prepended implicit 0 to Postfix\n");
                }
                postfix[postfix_count].type = TOK_NUMBER;
                postfix[postfix_count].value = 0;
                postfix[postfix_count].op = 0;
                postfix_count++;
            }

            char current_op = *p;
            int prec_curr = get_precedence(current_op);
            if (log_fp) {
                fprintf(log_fp, "[Calculator]   [Operator] '%c'  -> Precedence %d (%s-associative)\n",
                        current_op, prec_curr, is_right_associative(current_op) ? "Right" : "Left");
            }

            /*
             * Shunting-Yard Precedence Rule:
             * While the operator on top of the stack has greater precedence than
             * the incoming operator, OR equal precedence and incoming is left-associative,
             * pop the top operator from the stack to the postfix output.
             */
            char top_op;
            while (stack_peek(op_stack, &top_op) && top_op != '(') {
                int prec_top = get_precedence(top_op);
                if ((prec_top > prec_curr) || (prec_top == prec_curr && !is_right_associative(current_op))) {
                    stack_pop(op_stack, &top_op);
                    postfix[postfix_count].type = TOK_OPERATOR;
                    postfix[postfix_count].op = top_op;
                    postfix_count++;
                    if (log_fp) {
                        fprintf(log_fp, "[Calculator]             Stack top '%c' (prec %d) >= incoming '%c' (prec %d) -> Popped to Postfix\n",
                                top_op, prec_top, current_op, prec_curr);
                    }
                } else {
                    break;
                }
            }

            /* Push incoming operator onto the operator stack */
            stack_push(op_stack, &current_op);
            if (log_fp) {
                fprintf(log_fp, "[Calculator]             Pushed '%c' onto Operator Stack\n", current_op);
            }
            p++;
            expect_operand = true;
        }
        /* 1E. Unrecognized Characters */
        else {
            if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Syntax Error: Invalid character '%c'", *p);
            if (log_fp) {
                fprintf(log_fp, "[Calculator] [Error] Syntax Error: Invalid character '%c'\n", *p);
                fclose(log_fp);
            }
            stack_destroy(op_stack);
            return false;
        }
    }

    /* Drain any remaining operators from the stack to the postfix output */
    if (log_fp) {
        fprintf(log_fp, "[Calculator]   [Drain]   End of expression reached; draining remaining operators from stack:\n");
    }
    char top_op;
    while (stack_pop(op_stack, &top_op)) {
        if (top_op == '(') {
            if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Syntax Error: Unmatched opening '('");
            if (log_fp) {
                fprintf(log_fp, "[Calculator] [Error] Syntax Error: Unmatched opening '(' without ')'!\n");
                fclose(log_fp);
            }
            stack_destroy(op_stack);
            return false;
        }
        postfix[postfix_count].type = TOK_OPERATOR;
        postfix[postfix_count].op = top_op;
        postfix_count++;
        if (log_fp) {
            fprintf(log_fp, "[Calculator]             Popped '%c' from stack -> Appended to Postfix output\n", top_op);
        }
    }
    stack_destroy(op_stack);

    if (postfix_count == 0) {
        if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Empty expression");
        if (log_fp) {
            fprintf(log_fp, "[Calculator] [Error] Empty expression provided\n");
            fclose(log_fp);
        }
        return false;
    }

    /* Log compiled postfix stream */
    log_postfix_tokens(log_fp, postfix, postfix_count);

    /* -------------------------------------------------------------------------
     * Step 2: Evaluate Compiled Postfix Tokens using GenericStack
     * ------------------------------------------------------------------------- */
    if (log_fp) {
        fprintf(log_fp, "\n[Calculator] --- Step 2: Postfix Evaluation (Stack Execution) ---\n");
    }
    GenericStack *eval_stack = stack_create(sizeof(int), 32);

    for (int i = 0; i < postfix_count; i++) {
        if (postfix[i].type == TOK_NUMBER) {
            /* Push operand onto evaluation stack */
            stack_push(eval_stack, &postfix[i].value);
            if (log_fp) {
                fprintf(log_fp, "[Calculator]   [Push Operand] %d -> Pushed to Evaluation Stack\n", postfix[i].value);
            }
        } else {
            /*
             * Operator encountered:
             * Pop the top two values.
             * Note: In stack-based RPN evaluation:
             *   First popped value is the RIGHT operand (val2).
             *   Second popped value is the LEFT operand (val1).
             * This order is crucial for non-commutative operations: val1 - val2, val1 / val2, val1 ^ val2.
             */
            int val2, val1;
            if (!stack_pop(eval_stack, &val2) || !stack_pop(eval_stack, &val1)) {
                if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Syntax Error: Insufficient operands for '%c'", postfix[i].op);
                if (log_fp) {
                    fprintf(log_fp, "[Calculator] [Error] Insufficient operands on stack for operator '%c'\n", postfix[i].op);
                    fclose(log_fp);
                }
                stack_destroy(eval_stack);
                return false;
            }

            int res = 0;
            switch (postfix[i].op) {
                case '+':
                    res = val1 + val2;
                    if (log_fp) fprintf(log_fp, "[Calculator]   [Compute] %d + %d = %d\n", val1, val2, res);
                    break;
                case '-':
                    res = val1 - val2;
                    if (log_fp) fprintf(log_fp, "[Calculator]   [Compute] %d - %d = %d\n", val1, val2, res);
                    break;
                case '*':
                    res = val1 * val2;
                    if (log_fp) fprintf(log_fp, "[Calculator]   [Compute] %d * %d = %d\n", val1, val2, res);
                    break;
                case '/':
                    if (val2 == 0) {
                        if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Math Error: Division by zero");
                        if (log_fp) {
                            fprintf(log_fp, "[Calculator] [Error] Arithmetic Exception: Division by zero (%d / 0)!\n", val1);
                            fclose(log_fp);
                        }
                        stack_destroy(eval_stack);
                        return false;
                    }
                    res = val1 / val2;
                    if (log_fp) fprintf(log_fp, "[Calculator]   [Compute] %d / %d = %d\n", val1, val2, res);
                    break;
                case '^':
                    res = int_pow(val1, val2);
                    if (log_fp) fprintf(log_fp, "[Calculator]   [Compute] %d ^ %d = %d\n", val1, val2, res);
                    break;
                default:
                    if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Unknown operator '%c'", postfix[i].op);
                    if (log_fp) {
                        fprintf(log_fp, "[Calculator] [Error] Unknown operator '%c'\n", postfix[i].op);
                        fclose(log_fp);
                    }
                    stack_destroy(eval_stack);
                    return false;
            }

            /* Push intermediate result back onto evaluation stack */
            stack_push(eval_stack, &res);
            if (log_fp) {
                fprintf(log_fp, "[Calculator]             Result %d pushed back to Evaluation Stack\n", res);
            }
        }
    }

    /* Final result extraction */
    int final_res;
    if (!stack_pop(eval_stack, &final_res) || !stack_is_empty(eval_stack)) {
        if (err_buf && err_size > 0) snprintf(err_buf, err_size, "Syntax Error: Malformed expression");
        if (log_fp) {
            fprintf(log_fp, "[Calculator] [Error] Malformed expression: Extra unused operands remain on stack!\n");
            fclose(log_fp);
        }
        stack_destroy(eval_stack);
        return false;
    }

    stack_destroy(eval_stack);
    *out_result = final_res;

    if (log_fp) {
        fprintf(log_fp, "[Calculator] ==========================================================\n");
        fprintf(log_fp, "[Calculator] >>> Final Evaluated Result: %d <<<\n", final_res);
        fprintf(log_fp, "[Calculator] ==========================================================\n\n");
        fflush(log_fp);
        fclose(log_fp);
    }

    return true;
}
