#ifndef CALCULATOR_H
#define CALCULATOR_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Evaluates an infix arithmetic expression containing non-negative integers,
 * operators (+, -, *, /, ^), and parentheses '()'.
 *
 * Internally compiles the expression from Infix to Postfix (Shunting-Yard)
 * and evaluates it using GenericStack.
 *
 * @param infix_expr The null-terminated infix expression string.
 * @param out_result Pointer to store the evaluated integer result.
 * @param err_buf    Buffer to store error message if evaluation fails.
 * @param err_size   Capacity of err_buf.
 * @return true if evaluation succeeded, false on syntax or arithmetic error (e.g. div by 0).
 */
bool calculator_eval(const char *infix_expr, int *out_result, char *err_buf, size_t err_size);

#endif /* CALCULATOR_H */
