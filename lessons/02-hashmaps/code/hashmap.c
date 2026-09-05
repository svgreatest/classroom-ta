#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hashmap.h"

unsigned long hashmap_hash_djb2(const char* str) {
    unsigned long hash = 5381;
    int c;
    while ((c = (unsigned char)*str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

static char* custom_strdup(const char* s) {
    size_t len = strlen(s) + 1;
    char* copy = (char*)malloc(len);
    if (copy) memcpy(copy, s, len);
    return copy;
}

HashMap* hashmap_create(size_t initial_capacity, float max_load_factor) {
    if (initial_capacity == 0) initial_capacity = 8;
    if (max_load_factor <= 0.0f) max_load_factor = 0.75f;

    HashMap* map = (HashMap*)malloc(sizeof(HashMap));
    if (!map) return NULL;

    map->capacity = initial_capacity;
    map->size = 0;
    map->max_load_factor = max_load_factor;
    map->buckets = (HashNode**)calloc(map->capacity, sizeof(HashNode*));
    return map;
}

static bool hashmap_rehash(HashMap* map, size_t new_capacity) {
    HashNode** new_buckets = (HashNode**)calloc(new_capacity, sizeof(HashNode*));
    if (!new_buckets) return false;

    for (size_t i = 0; i < map->capacity; i++) {
        HashNode* curr = map->buckets[i];
        while (curr) {
            HashNode* next = curr->next;
            size_t new_idx = hashmap_hash_djb2(curr->key) % new_capacity;
            curr->next = new_buckets[new_idx];
            new_buckets[new_idx] = curr;
            curr = next;
        }
    }

    free(map->buckets);
    map->buckets = new_buckets;
    map->capacity = new_capacity;
    return true;
}

bool hashmap_put(HashMap* map, const char* key, int value) {
    if (!map || !key) return false;

    if ((float)(map->size + 1) / (float)map->capacity > map->max_load_factor) {
        hashmap_rehash(map, map->capacity * 2);
    }

    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            curr->value = value;
            return true;
        }
        curr = curr->next;
    }

    HashNode* new_node = (HashNode*)malloc(sizeof(HashNode));
    new_node->key = custom_strdup(key);
    new_node->value = value;
    new_node->next = map->buckets[index];
    map->buckets[index] = new_node;
    map->size++;
    return true;
}

bool hashmap_get(const HashMap* map, const char* key, int* out_value) {
    if (!map || !key) return false;
    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            if (out_value) *out_value = curr->value;
            return true;
        }
        curr = curr->next;
    }
    return false;
}

bool hashmap_delete(HashMap* map, const char* key) {
    if (!map || !key) return false;
    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    HashNode* prev = NULL;

    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            if (prev) prev->next = curr->next;
            else map->buckets[index] = curr->next;
            free(curr->key);
            free(curr);
            map->size--;
            return true;
        }
        prev = curr;
        curr = curr->next;
    }
    return false;
}

bool hashmap_contains(const HashMap* map, const char* key) {
    return hashmap_get(map, key, NULL);
}

size_t hashmap_size(const HashMap* map) {
    return map ? map->size : 0;
}

size_t hashmap_capacity(const HashMap* map) {
    return map ? map->capacity : 0;
}

float hashmap_load_factor(const HashMap* map) {
    if (!map || map->capacity == 0) return 0.0f;
    return (float)map->size / (float)map->capacity;
}

void hashmap_destroy(HashMap* map) {
    if (!map) return;
    for (size_t i = 0; i < map->capacity; i++) {
        HashNode* curr = map->buckets[i];
        while (curr) {
            HashNode* next = curr->next;
            free(curr->key);
            free(curr);
            curr = next;
        }
    }
    free(map->buckets);
    free(map);
}

void hashmap_print_ascii(const HashMap* map) {
    printf("--- Hash Map Table: Capacity = %u, Size = %u, Load Factor = %.2f ---\n",
           (unsigned int)map->capacity, (unsigned int)map->size, (double)hashmap_load_factor(map));

    for (size_t i = 0; i < map->capacity; i++) {
        printf("  [Bucket %2u]: ", (unsigned int)i);
        HashNode* curr = map->buckets[i];
        if (!curr) {
            printf("NULL\n");
            continue;
        }
        while (curr) {
            printf("(%s: %d) -> ", curr->key, curr->value);
            curr = curr->next;
        }
        printf("NULL\n");
    }
    printf("------------------------------------------------------------------------\n");
}
