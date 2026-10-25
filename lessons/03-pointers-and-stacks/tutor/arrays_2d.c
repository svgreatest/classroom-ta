// Title: 2-D arrays and row pointers
#include <stdio.h>

int main() {
    // 3 rows of 4 ints, stored as 12 ints in a row
    int m[3][4] = {
        {1, 2,  3,  4},
        {5, 6,  7,  8},
        {9, 10, 11, 12}
    };

    int (*row)[4] = m;     // points at a whole row (16 bytes)
    int *cell = &m[0][0];  // points at one int (4 bytes)

    row = row + 1;         // jumps one ROW: now at {5, 6, 7, 8}
    cell = cell + 1;       // jumps one INT: now at 2

    int a = (*row)[2];     // row 1, column 2 -> 7
    int b = *(*(m + 2) + 1); // same as m[2][1] -> 10

    // The same 12 ints, walked as one flat street
    int *flat = &m[0][0];
    int last = *(flat + 11); // m[2][3] -> 12

    printf("a=%d b=%d last=%d\n", a, b, last);
    return 0;
}
