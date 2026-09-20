#ifndef HASHMAP_H
#define HASHMAP_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Classroom Teaching Assistant (Classroom TA)
 * Lesson 02: Hash Map with Separate Chaining & Dynamic Rehashing
 */

typedef struct HashNode {
    char* key;
    int value;
    struct HashNode* next;
} HashNode;

typedef struct HashMap {
    HashNode** buckets;
    size_t capacity;
    size_t size;
    float max_load_factor;
} HashMap;

// Allocation and Destruction
HashMap* hashmap_create(size_t initial_capacity, float max_load_factor);
void hashmap_destroy(HashMap* map);

// Operations
bool hashmap_put(HashMap* map, const char* key, int value);
bool hashmap_get(const HashMap* map, const char* key, int* out_value);
bool hashmap_delete(HashMap* map, const char* key);
bool hashmap_contains(const HashMap* map, const char* key);

// Metrics
size_t hashmap_size(const HashMap* map);
size_t hashmap_capacity(const HashMap* map);
float hashmap_load_factor(const HashMap* map);
unsigned long hashmap_hash_djb2(const char* str);
void hashmap_print_ascii(const HashMap* map);

#endif // HASHMAP_H
