#include <stdio.h>
#include <time.h>

// 5000 x 5000 size fits cleanly into global memory without stacking issues
#define SIZE 5000 

int matrix[SIZE][SIZE];


void sum_matrix_elems1() {
    long long total = 0;
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            total += matrix[i][j];
        }
    }
    printf("Total in sum_matrix_elems1 = %lld\n", total);
}

void sum_matrix_elems2() {
    long long total = 0;
    for (int j = 0; j < SIZE; j++) { 
        for (int i = 0; i < SIZE; i++) {   
            total += matrix[i][j];
        }
    }
    printf("Total in sum_matrix_elems2 = %lld\n", total);
}

int main() {

    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            matrix[i][j] = 1;
        }
    }

    printf("Running performance test...\n");

    // Time function1
    clock_t start1 = clock();
    sum_matrix_elems1();
    clock_t end1 = clock();
    double time1 = ((double)(end1 - start1)) / CLOCKS_PER_SEC * 1000.0;

    // Time function2
    clock_t start2 = clock();
    sum_matrix_elems2();
    clock_t end2 = clock();
    double time2 = ((double)(end2 - start2)) / CLOCKS_PER_SEC * 1000.0;

    // Output the results cleanly
    printf("\nResults:\n");
    printf("sum_matrix_elems1 Time: %.2f ms\n", time1);
    printf("sum_matrix_elems2 Time: %.2f ms\n", time2);
    
    printf("\n sum_matrix_elems1 was %.2fx FASTER!\n", time2 / time1);

    return 0;
}
