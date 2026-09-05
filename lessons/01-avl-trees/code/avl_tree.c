#include <stdio.h>
#include <stdlib.h>
#include "avl_tree.h"

static int max_int(int a, int b) {
    return (a > b) ? a : b;
}

AVLNode* avl_create_node(int key) {
    AVLNode* node = (AVLNode*)malloc(sizeof(AVLNode));
    if (!node) {
        perror("Failed to allocate AVLNode");
        exit(EXIT_FAILURE);
    }
    node->key = key;
    node->height = 1;
    node->left = NULL;
    node->right = NULL;
    return node;
}

int avl_height(const AVLNode* node) {
    return node ? node->height : 0;
}

int avl_balance_factor(const AVLNode* node) {
    return node ? avl_height(node->left) - avl_height(node->right) : 0;
}

static void update_height(AVLNode* node) {
    if (node) {
        node->height = 1 + max_int(avl_height(node->left), avl_height(node->right));
    }
}

AVLNode* avl_rotate_right(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;

    x->right = y;
    y->left = T2;

    update_height(y);
    update_height(x);

    return x;
}

AVLNode* avl_rotate_left(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;

    y->left = x;
    x->right = T2;

    update_height(x);
    update_height(y);

    return y;
}

AVLNode* avl_insert(AVLNode* node, int key) {
    if (!node) return avl_create_node(key);

    if (key < node->key) {
        node->left = avl_insert(node->left, key);
    } else if (key > node->key) {
        node->right = avl_insert(node->right, key);
    } else {
        return node;
    }

    update_height(node);
    int balance = avl_balance_factor(node);

    // LL Case
    if (balance > 1 && key < node->left->key)
        return avl_rotate_right(node);

    // RR Case
    if (balance < -1 && key > node->right->key)
        return avl_rotate_left(node);

    // LR Case
    if (balance > 1 && key > node->left->key) {
        node->left = avl_rotate_left(node->left);
        return avl_rotate_right(node);
    }

    // RL Case
    if (balance < -1 && key < node->right->key) {
        node->right = avl_rotate_right(node->right);
        return avl_rotate_left(node);
    }

    return node;
}

static AVLNode* min_value_node(AVLNode* node) {
    AVLNode* current = node;
    while (current && current->left) current = current->left;
    return current;
}

AVLNode* avl_delete(AVLNode* root, int key) {
    if (!root) return root;

    if (key < root->key) {
        root->left = avl_delete(root->left, key);
    } else if (key > root->key) {
        root->right = avl_delete(root->right, key);
    } else {
        if (!root->left || !root->right) {
            AVLNode* temp = root->left ? root->left : root->right;
            if (!temp) {
                temp = root;
                root = NULL;
            } else {
                *root = *temp;
            }
            free(temp);
        } else {
            AVLNode* temp = min_value_node(root->right);
            root->key = temp->key;
            root->right = avl_delete(root->right, temp->key);
        }
    }

    if (!root) return root;

    update_height(root);
    int balance = avl_balance_factor(root);

    if (balance > 1 && avl_balance_factor(root->left) >= 0)
        return avl_rotate_right(root);

    if (balance > 1 && avl_balance_factor(root->left) < 0) {
        root->left = avl_rotate_left(root->left);
        return avl_rotate_right(root);
    }

    if (balance < -1 && avl_balance_factor(root->right) <= 0)
        return avl_rotate_left(root);

    if (balance < -1 && avl_balance_factor(root->right) > 0) {
        root->right = avl_rotate_right(root->right);
        return avl_rotate_left(root);
    }

    return root;
}

const AVLNode* avl_find(const AVLNode* root, int key) {
    if (!root || root->key == key) return root;
    if (key < root->key) return avl_find(root->left, key);
    return avl_find(root->right, key);
}

void avl_destroy(AVLNode* root) {
    if (!root) return;
    avl_destroy(root->left);
    avl_destroy(root->right);
    free(root);
}

static AVLNode* build_fib_avl(int h, int* counter) {
    if (h <= 0) return NULL;
    if (h == 1) {
        int key = (*counter)++;
        return avl_create_node(key * 10);
    }
    AVLNode* left = build_fib_avl(h - 1, counter);
    int key = (*counter)++;
    AVLNode* root = avl_create_node(key * 10);
    root->left = left;
    root->right = build_fib_avl(h - 2, counter);
    update_height(root);
    return root;
}

AVLNode* avl_create_by_height(int target_h) {
    if (target_h <= 0) return NULL;
    int counter = 1;
    return build_fib_avl(target_h, &counter);
}

static void print_ascii_helper(const AVLNode* root, int space) {
    const int COUNT = 6;
    if (!root) return;
    space += COUNT;
    print_ascii_helper(root->right, space);
    printf("\n");
    for (int i = COUNT; i < space; i++) printf(" ");
    printf("[%d|h:%d|bf:%d]\n", root->key, root->height, avl_balance_factor(root));
    print_ascii_helper(root->left, space);
}

void avl_print_ascii(const AVLNode* root) {
    printf("--- AVL Tree (ASCII Diagram: Right branch top, Left branch bottom) ---\n");
    if (!root) {
        printf("  (empty tree)\n");
    } else {
        print_ascii_helper(root, 0);
    }
    printf("----------------------------------------------------------------------\n");
}
