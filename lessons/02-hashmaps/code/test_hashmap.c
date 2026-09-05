#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <stdbool.h>
#include "hashmap.h"

static int g_assert_count = 0;
#define TEST_ASSERT(cond) do { \
    if (!(cond)) { \
        fprintf(stderr, "ASSERTION FAILED: %s (at %s:%d)\n", #cond, __FILE__, __LINE__); \
        exit(1); \
    } \
    g_assert_count++; \
} while (0)

static void test_create_and_destroy(void) {
    HashMap* map = hashmap_create(8, 0.75f);
    TEST_ASSERT(map != NULL);
    TEST_ASSERT(hashmap_size(map) == 0);
    TEST_ASSERT(hashmap_capacity(map) == 8);
    TEST_ASSERT(hashmap_load_factor(map) == 0.0f);

    hashmap_destroy(map);
    printf("  [PASS] Create and destroy hashmap test\n");
}

static void test_insert_and_get(void) {
    HashMap* map = hashmap_create(16, 0.75f);
    int val = 0;

    TEST_ASSERT(hashmap_put(map, "apple", 100));
    TEST_ASSERT(hashmap_put(map, "banana", 200));
    TEST_ASSERT(hashmap_put(map, "cherry", 300));
    TEST_ASSERT(hashmap_size(map) == 3);

    TEST_ASSERT(hashmap_get(map, "apple", &val) && val == 100);
    TEST_ASSERT(hashmap_get(map, "banana", &val) && val == 200);
    TEST_ASSERT(hashmap_get(map, "cherry", &val) && val == 300);
    TEST_ASSERT(!hashmap_get(map, "nonexistent", &val));

    hashmap_destroy(map);
    printf("  [PASS] Insert and get operations test\n");
}

static void test_update_existing_key(void) {
    HashMap* map = hashmap_create(16, 0.75f);
    int val = 0;

    hashmap_put(map, "score", 50);
    TEST_ASSERT(hashmap_size(map) == 1);
    TEST_ASSERT(hashmap_get(map, "score", &val) && val == 50);

    // Update with new value: size should not increase
    hashmap_put(map, "score", 99);
    TEST_ASSERT(hashmap_size(map) == 1);
    TEST_ASSERT(hashmap_get(map, "score", &val) && val == 99);

    hashmap_destroy(map);
    printf("  [PASS] Update existing key in-place test\n");
}

static void test_collision_chaining(void) {
    // Capacity 2 guarantees collisions
    HashMap* map = hashmap_create(2, 0.99f);
    int val = 0;

    hashmap_put(map, "k1", 1);
    hashmap_put(map, "k2", 2);
    hashmap_put(map, "k3", 3);
    hashmap_put(map, "k4", 4);

    TEST_ASSERT(hashmap_size(map) >= 4);
    TEST_ASSERT(hashmap_get(map, "k1", &val) && val == 1);
    TEST_ASSERT(hashmap_get(map, "k2", &val) && val == 2);
    TEST_ASSERT(hashmap_get(map, "k3", &val) && val == 3);
    TEST_ASSERT(hashmap_get(map, "k4", &val) && val == 4);

    hashmap_destroy(map);
    printf("  [PASS] Collision chaining in buckets test\n");
}

static void test_deletion(void) {
    HashMap* map = hashmap_create(4, 0.99f);
    int val = 0;

    hashmap_put(map, "alpha", 1);
    hashmap_put(map, "beta", 2);
    hashmap_put(map, "gamma", 3);
    TEST_ASSERT(hashmap_size(map) == 3);

    // Delete non-existent key
    TEST_ASSERT(!hashmap_delete(map, "delta"));
    TEST_ASSERT(hashmap_size(map) == 3);

    // Delete existing key
    TEST_ASSERT(hashmap_delete(map, "beta"));
    TEST_ASSERT(hashmap_size(map) == 2);
    TEST_ASSERT(!hashmap_get(map, "beta", &val));
    TEST_ASSERT(hashmap_get(map, "alpha", &val) && val == 1);
    TEST_ASSERT(hashmap_get(map, "gamma", &val) && val == 3);

    hashmap_destroy(map);
    printf("  [PASS] Key deletion with chain preservation test\n");
}

static void test_dynamic_rehashing(void) {
    // Initial capacity 4, threshold 0.75 => threshold count is 4 * 0.75 = 3 items.
    HashMap* map = hashmap_create(4, 0.75f);
    int val = 0;

    hashmap_put(map, "item1", 10);
    hashmap_put(map, "item2", 20);
    hashmap_put(map, "item3", 30);
    TEST_ASSERT(hashmap_capacity(map) == 4);

    // Inserting 4th item triggers capacity doubling to 8
    hashmap_put(map, "item4", 40);
    TEST_ASSERT(hashmap_capacity(map) == 8);
    TEST_ASSERT(hashmap_size(map) == 4);

    // Verify all items are preserved and reachable after rehashing
    TEST_ASSERT(hashmap_get(map, "item1", &val) && val == 10);
    TEST_ASSERT(hashmap_get(map, "item2", &val) && val == 20);
    TEST_ASSERT(hashmap_get(map, "item3", &val) && val == 30);
    TEST_ASSERT(hashmap_get(map, "item4", &val) && val == 40);

    // Insert 3 more items to reach 7/8 = 0.875 > 0.75 => triggers doubling to 16
    hashmap_put(map, "item5", 50);
    hashmap_put(map, "item6", 60);
    hashmap_put(map, "item7", 70);
    TEST_ASSERT(hashmap_capacity(map) == 16);

    hashmap_destroy(map);
    printf("  [PASS] Dynamic rehashing and capacity doubling test\n");
}

static void test_bulk_operations(void) {
    HashMap* map = hashmap_create(8, 0.75f);
    char key[32];
    int val = 0;

    for (int i = 0; i < 100; i++) {
        snprintf(key, sizeof(key), "user_%d", i);
        hashmap_put(map, key, i * 7);
    }

    TEST_ASSERT(hashmap_size(map) == 100);
    TEST_ASSERT(hashmap_load_factor(map) <= 0.75f);

    for (int i = 0; i < 100; i++) {
        snprintf(key, sizeof(key), "user_%d", i);
        TEST_ASSERT(hashmap_get(map, key, &val) && val == i * 7);
    }

    hashmap_destroy(map);
    printf("  [PASS] Bulk 100 keys insertion & verification test\n");
}

int main(void) {
    printf("====================================================\n");
    printf("Classroom TA -- Hash Map C Test Suite (TDD)\n");
    printf("====================================================\n");

    test_create_and_destroy();
    test_insert_and_get();
    test_update_existing_key();
    test_collision_chaining();
    test_deletion();
    test_dynamic_rehashing();
    test_bulk_operations();

    printf("====================================================\n");
    printf("ALL TESTS PASSED! Total verified assertions: %d\n", g_assert_count);
    printf("====================================================\n");
    return 0;
}
