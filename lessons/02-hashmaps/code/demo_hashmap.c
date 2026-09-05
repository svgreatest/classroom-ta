#include <stdio.h>
#include <stdlib.h>
#include "hashmap.h"

int main(void) {
    printf("======================================================================\n");
    printf("   CLASSROOM TEACHING ASSISTANT (Classroom TA) -- Hash Map Demo\n");
    printf("======================================================================\n\n");

    printf("1. Creating Hash Map with initial capacity = 4, max_load_factor = 0.75\n\n");
    HashMap* map = hashmap_create(4, 0.75f);

    printf("2. Inserting 3 elements (apple, banana, cherry)...\n");
    hashmap_put(map, "apple", 100);
    hashmap_put(map, "banana", 200);
    hashmap_put(map, "cherry", 300);
    hashmap_print_ascii(map);

    printf("\n3. Inserting 4th element ('durian'):\n");
    printf("   Load factor exceeds 0.75 -> Triggers dynamic table doubling to 8!\n");
    hashmap_put(map, "durian", 400);
    hashmap_print_ascii(map);

    printf("\n4. Deleting 'banana' from map...\n");
    hashmap_delete(map, "banana");
    hashmap_print_ascii(map);

    hashmap_destroy(map);
    printf("\nHash map memory freed successfully. Ready for classroom questions!\n");
    return 0;
}
