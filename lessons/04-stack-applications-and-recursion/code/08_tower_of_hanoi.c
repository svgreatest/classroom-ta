#include <stdio.h>
#include <stdbool.h>
#include "generic_stack.h"

static int step_count = 0;

// Three physical Pegs modeled as GenericStack data structures
static GenericStack *peg_A = NULL;
static GenericStack *peg_B = NULL;
static GenericStack *peg_C = NULL;

static GenericStack* get_peg(char name) {
    if (name == 'A') return peg_A;
    if (name == 'B') return peg_B;
    return peg_C;
}

/**
 * Executes a verified disk move between pegs.
 */
static void move_disk(int disk, char from, char to) {
    step_count++;
    GenericStack *src = get_peg(from);
    GenericStack *dst = get_peg(to);

    // Physically pop disk from source peg
    int popped_disk = 0;
    stack_pop(src, &popped_disk);

    // Invariant check: cannot place larger disk on smaller disk
    int top_disk = 0;
    if (stack_peek(dst, &top_disk) && top_disk < popped_disk) {
        printf("FATAL ERROR: Rule violation! Disk %d cannot be placed on smaller disk %d!\n",
               popped_disk, top_disk);
        return;
    }

    // Physically push disk to destination peg
    stack_push(dst, &popped_disk);

    printf("Step %2d: Move disk %d from Peg %c -> Peg %c (Peg sizes: A=%d, B=%d, C=%d)\n",
           step_count, disk, from, to,
           stack_size(peg_A), stack_size(peg_B), stack_size(peg_C));
}

/**
 * Recursive Divide-and-Conquer Tower of Hanoi algorithm.
 */
void hanoi(int n, char from_peg, char to_peg, char aux_peg) {
    if (n == 0) return;

    // 1. Move n-1 disks from Source to Auxiliary
    hanoi(n - 1, from_peg, aux_peg, to_peg);

    // 2. Move largest disk directly from Source to Destination
    move_disk(n, from_peg, to_peg);

    // 3. Move n-1 disks from Auxiliary to Destination
    hanoi(n - 1, aux_peg, to_peg, from_peg);
}

int main(void) {
    int n = 3;

    // Initialize physical peg stacks for integer disk IDs
    peg_A = stack_create(sizeof(int), n);
    peg_B = stack_create(sizeof(int), n);
    peg_C = stack_create(sizeof(int), n);

    // Setup: disks on Peg A sorted largest to smallest (bottom to top)
    for (int d = n; d >= 1; d--) {
        stack_push(peg_A, &d);
    }

    printf("=== Topic 8: Tower of Hanoi (%d Disks) ===\n", n);
    printf("Initial: Peg A=%d disks, Peg B=%d disks, Peg C=%d disks\n\n",
           stack_size(peg_A), stack_size(peg_B), stack_size(peg_C));

    hanoi(n, 'A', 'C', 'B');

    printf("\nTotal Moves Executed: %d (Theoretical 2^n - 1 = %d)\n", step_count, (1 << n) - 1);
    printf("Final:   Peg A=%d disks, Peg B=%d disks, Peg C=%d disks\n",
           stack_size(peg_A), stack_size(peg_B), stack_size(peg_C));

    stack_destroy(peg_A);
    stack_destroy(peg_B);
    stack_destroy(peg_C);
    return 0;
}
