#include <stdio.h>
#include <stdlib.h>
#include "avl_tree.h"

int main(int argc, char* argv[]) {
    printf("======================================================================\n");
    printf("   CLASSROOM TEACHING ASSISTANT (Classroom TA) -- AVL Tree Demo\n");
    printf("======================================================================\n\n");

    int target_h = 3;
    if (argc > 1) target_h = atoi(argv[1]);

    printf("1. Generating Minimal Fibonacci AVL Tree of Target Height: %d\n", target_h);
    AVLNode* root = avl_create_by_height(target_h);
    avl_print_ascii(root);

    printf("\n2. Live Insertion: Inserting key 35 into tree...\n");
    root = avl_insert(root, 35);
    avl_print_ascii(root);

    printf("\n3. Live Deletion: Deleting key 30 from tree...\n");
    root = avl_delete(root, 30);
    avl_print_ascii(root);

    avl_destroy(root);
    printf("\nAVL tree memory successfully freed. Ready for in-class questions!\n");
    return 0;
}
