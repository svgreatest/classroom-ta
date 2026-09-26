#include <stdio.h>
#include <string.h>
#include "generic_stack.h"

/**
 * Reverses an array of integers using the Generic Stack ADT.
 */
void reverse_integers(int *arr, int n) {
    GenericStack *s = stack_create(sizeof(int), n);
    if (!s) return;

    for (int i = 0; i < n; i++) {
        stack_push(s, &arr[i]);
    }
    for (int i = 0; i < n; i++) {
        stack_pop(s, &arr[i]);
    }

    stack_destroy(s);
}

/**
 * Reverses a string of characters using the exact same Generic Stack ADT.
 */
void reverse_string(char *str) {
    int len = (int)strlen(str);
    GenericStack *s = stack_create(sizeof(char), len);
    if (!s) return;

    for (int i = 0; i < len; i++) {
        stack_push(s, &str[i]);
    }
    for (int i = 0; i < len; i++) {
        stack_pop(s, &str[i]);
    }

    stack_destroy(s);
}

int main(void) {
    int numbers[] = {10, 20, 30, 40, 50};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("Original numbers: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    reverse_integers(numbers, n);

    printf("Reversed numbers: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n\n");

    char text[] = "DATASTRUCTURES";
    printf("Original text: %s\n", text);
    reverse_string(text);
    printf("Reversed text: %s\n", text);

    return 0;
}
