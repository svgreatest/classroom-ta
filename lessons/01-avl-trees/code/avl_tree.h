#ifndef AVL_TREE_H
#define AVL_TREE_H

#include <stdbool.h>

/**
 * Classroom Teaching Assistant (Classroom TA)
 * Lesson 01: AVL Tree Implementation in C (TDD Verified)
 */

typedef struct AVLNode {
    int key;
    int height;
    struct AVLNode* left;
    struct AVLNode* right;
} AVLNode;

// Allocation and Inspection
AVLNode* avl_create_node(int key);
int avl_height(const AVLNode* node);
int avl_balance_factor(const AVLNode* node);

// Core AVL Operations
AVLNode* avl_insert(AVLNode* root, int key);
AVLNode* avl_delete(AVLNode* root, int key);
const AVLNode* avl_find(const AVLNode* root, int key);
void avl_destroy(AVLNode* root);

// Rotations
AVLNode* avl_rotate_right(AVLNode* y);
AVLNode* avl_rotate_left(AVLNode* x);

// Parameterized Generation by Target Height
AVLNode* avl_create_by_height(int target_h);
void avl_print_ascii(const AVLNode* root);

#endif // AVL_TREE_H
