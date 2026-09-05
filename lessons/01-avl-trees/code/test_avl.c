#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <stdbool.h>
#include "avl_tree.h"

static int g_assert_count = 0;
#define TEST_ASSERT(cond) do { \
    if (!(cond)) { \
        fprintf(stderr, "ASSERTION FAILED: %s (at %s:%d)\n", #cond, __FILE__, __LINE__); \
        exit(1); \
    } \
    g_assert_count++; \
} while (0)

// Helper: verify all AVL invariants recursively
static bool verify_avl_invariants(const AVLNode* node, int* out_height) {
    if (!node) {
        if (out_height) *out_height = 0;
        return true;
    }

    int left_h = 0, right_h = 0;
    if (!verify_avl_invariants(node->left, &left_h)) return false;
    if (!verify_avl_invariants(node->right, &right_h)) return false;

    // Height invariant: height = 1 + max(left_h, right_h)
    int expected_h = 1 + (left_h > right_h ? left_h : right_h);
    if (node->height != expected_h) return false;

    // Balance factor invariant: BF = left_h - right_h must be in {-1, 0, 1}
    int bf = left_h - right_h;
    if (bf < -1 || bf > 1) return false;

    // BST ordering invariant
    if (node->left && node->left->key >= node->key) return false;
    if (node->right && node->right->key <= node->key) return false;

    if (out_height) *out_height = expected_h;
    return true;
}

// Helper: in-order collection to check sortedness
static void inorder_collect(const AVLNode* root, int* arr, int* count) {
    if (!root) return;
    inorder_collect(root->left, arr, count);
    arr[(*count)++] = root->key;
    inorder_collect(root->right, arr, count);
}

static void test_empty_and_single_node(void) {
    AVLNode* root = NULL;
    TEST_ASSERT(avl_height(root) == 0);
    TEST_ASSERT(avl_balance_factor(root) == 0);

    root = avl_insert(root, 42);
    TEST_ASSERT(root != NULL);
    TEST_ASSERT(root->key == 42);
    TEST_ASSERT(avl_height(root) == 1);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] Empty tree and single node test\n");
}

static void test_simple_balanced_bst(void) {
    AVLNode* root = NULL;
    root = avl_insert(root, 20);
    root = avl_insert(root, 10);
    root = avl_insert(root, 30);

    TEST_ASSERT(root->key == 20);
    TEST_ASSERT(root->left->key == 10);
    TEST_ASSERT(root->right->key == 30);
    TEST_ASSERT(avl_height(root) == 2);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] Simple balanced BST test\n");
}

static void test_right_rotation_left_left(void) {
    // Insert: 30 -> 20 -> 10 (Left-Left imbalance at 30)
    AVLNode* root = NULL;
    root = avl_insert(root, 30);
    root = avl_insert(root, 20);
    root = avl_insert(root, 10);

    // After single right rotation: 20 becomes root, 10 left, 30 right
    TEST_ASSERT(root != NULL);
    TEST_ASSERT(root->key == 20);
    TEST_ASSERT(root->left != NULL && root->left->key == 10);
    TEST_ASSERT(root->right != NULL && root->right->key == 30);
    TEST_ASSERT(avl_height(root) == 2);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] LL single right rotation test\n");
}

static void test_left_rotation_right_right(void) {
    // Insert: 10 -> 20 -> 30 (Right-Right imbalance at 10)
    AVLNode* root = NULL;
    root = avl_insert(root, 10);
    root = avl_insert(root, 20);
    root = avl_insert(root, 30);

    // After single left rotation: 20 becomes root, 10 left, 30 right
    TEST_ASSERT(root != NULL);
    TEST_ASSERT(root->key == 20);
    TEST_ASSERT(root->left != NULL && root->left->key == 10);
    TEST_ASSERT(root->right != NULL && root->right->key == 30);
    TEST_ASSERT(avl_height(root) == 2);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] RR single left rotation test\n");
}

static void test_double_rotation_left_right(void) {
    // Insert: 30 -> 10 -> 20 (Left-Right imbalance at 30)
    AVLNode* root = NULL;
    root = avl_insert(root, 30);
    root = avl_insert(root, 10);
    root = avl_insert(root, 20);

    // After left-right rotation: 20 becomes root, 10 left, 30 right
    TEST_ASSERT(root != NULL);
    TEST_ASSERT(root->key == 20);
    TEST_ASSERT(root->left != NULL && root->left->key == 10);
    TEST_ASSERT(root->right != NULL && root->right->key == 30);
    TEST_ASSERT(avl_height(root) == 2);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] LR double rotation test\n");
}

static void test_double_rotation_right_left(void) {
    // Insert: 10 -> 30 -> 20 (Right-Left imbalance at 10)
    AVLNode* root = NULL;
    root = avl_insert(root, 10);
    root = avl_insert(root, 30);
    root = avl_insert(root, 20);

    // After right-left rotation: 20 becomes root, 10 left, 30 right
    TEST_ASSERT(root != NULL);
    TEST_ASSERT(root->key == 20);
    TEST_ASSERT(root->left != NULL && root->left->key == 10);
    TEST_ASSERT(root->right != NULL && root->right->key == 30);
    TEST_ASSERT(avl_height(root) == 2);
    TEST_ASSERT(avl_balance_factor(root) == 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    avl_destroy(root);
    printf("  [PASS] RL double rotation test\n");
}

static void test_parameterized_tree_by_height(void) {
    // Parameterized generation: instructor defines target height h
    for (int target_h = 1; target_h <= 6; target_h++) {
        AVLNode* tree = avl_create_by_height(target_h);
        TEST_ASSERT(tree != NULL);
        TEST_ASSERT(avl_height(tree) == target_h);
        TEST_ASSERT(verify_avl_invariants(tree, NULL));

        int keys[256];
        int count = 0;
        inorder_collect(tree, keys, &count);
        TEST_ASSERT(count > 0);
        for (int i = 0; i < count - 1; i++) {
            TEST_ASSERT(keys[i] < keys[i + 1]); // In-order sorted invariant
        }

        avl_destroy(tree);
    }
    printf("  [PASS] Parameterized tree generation by target height (h=1..6)\n");
}

static void test_deletion_and_rebalancing(void) {
    AVLNode* root = NULL;
    int values[] = {9, 5, 10, 0, 6, 11, -1, 1, 2};
    int n = sizeof(values) / sizeof(values[0]);

    for (int i = 0; i < n; i++) {
        root = avl_insert(root, values[i]);
    }
    TEST_ASSERT(verify_avl_invariants(root, NULL));

    // Delete node 10 (triggers rebalancing)
    root = avl_delete(root, 10);
    TEST_ASSERT(verify_avl_invariants(root, NULL));
    TEST_ASSERT(avl_find(root, 10) == NULL);

    // Delete node 0
    root = avl_delete(root, 0);
    TEST_ASSERT(verify_avl_invariants(root, NULL));
    TEST_ASSERT(avl_find(root, 0) == NULL);

    avl_destroy(root);
    printf("  [PASS] Deletion with rebalancing test\n");
}

static void test_bulk_insertions(void) {
    AVLNode* root = NULL;
    // Insert 100 sequential elements: in standard BST this degenerates to h=100.
    // In AVL it must satisfy h <= 1.44 * log2(102) ~ 10
    for (int i = 1; i <= 100; i++) {
        root = avl_insert(root, i);
        TEST_ASSERT(verify_avl_invariants(root, NULL));
    }

    int h = avl_height(root);
    TEST_ASSERT(h <= 10); // Logarithmic height guarantee

    int keys[128];
    int count = 0;
    inorder_collect(root, keys, &count);
    TEST_ASSERT(count == 100);
    for (int i = 0; i < 99; i++) {
        TEST_ASSERT(keys[i] == i + 1);
    }

    avl_destroy(root);
    printf("  [PASS] Bulk 100 insertions (AVL O(log n) height guarantee) test\n");
}

int main(void) {
    printf("====================================================\n");
    printf("Classroom TA -- AVL Tree C Test Suite (TDD)\n");
    printf("====================================================\n");

    test_empty_and_single_node();
    test_simple_balanced_bst();
    test_right_rotation_left_left();
    test_left_rotation_right_right();
    test_double_rotation_left_right();
    test_double_rotation_right_left();
    test_parameterized_tree_by_height();
    test_deletion_and_rebalancing();
    test_bulk_insertions();

    printf("====================================================\n");
    printf("ALL TESTS PASSED! Total verified assertions: %d\n", g_assert_count);
    printf("====================================================\n");
    return 0;
}
