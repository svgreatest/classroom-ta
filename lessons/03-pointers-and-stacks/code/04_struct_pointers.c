#include <stdio.h>

typedef struct {
    int id;
    int age;
    double gpa;
} Student;

// Modify a struct by passing its address
void boost_gpa(Student *s, double bonus) {
    // -> operator is shorthand for (*s).gpa
    s->gpa += bonus;
    printf("Inside boost_gpa: student %d new GPA = %.2f\n", s->id, s->gpa);
}

int main(void) {
    Student alice = { .id = 1001, .age = 20, .gpa = 3.65 };
    Student *ptr = &alice;

    printf("Alice base address: %p\n", (void*)&alice);
    printf("Alice id offset:    %p\n", (void*)&alice.id);
    printf("Alice age offset:   %p\n", (void*)&alice.age);
    printf("Alice gpa offset:   %p\n", (void*)&alice.gpa);

    // Member access via pointer
    printf("Direct read: (*ptr).gpa = %.2f\n", (*ptr).gpa);
    printf("Arrow read:  ptr->gpa   = %.2f\n", ptr->gpa);

    // Boost GPA via function
    boost_gpa(&alice, 0.25);
    printf("Final Alice GPA in main: %.2f\n", alice.gpa);

    return 0;
}
