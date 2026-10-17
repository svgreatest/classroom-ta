/*
 * Acceptance tests for WEB-142.
 *
 * Each test below is one acceptance criterion from the ticket, written as
 * code. If all of them pass, the feature does what the ticket asked for.
 * In industry these run automatically on every pull request (CI), so a
 * change that breaks Back/Forward can't be merged unnoticed.
 *
 * Build and run:  mingw32-make test
 */

#include "browser_history.h"
#include <stdio.h>
#include <string.h>

static int failures = 0;

// Tiny test helpers. A real team would use a framework (Unity, CMocka,
// GoogleTest); the idea is the same: check, and report the line that failed.
#define EXPECT(cond)                                                              \
    do {                                                                          \
        if (!(cond)) {                                                            \
            printf("  FAIL line %d: %s\n", __LINE__, #cond);                      \
            failures++;                                                           \
        }                                                                         \
    } while (0)

#define EXPECT_URL(h, expected)                                                   \
    do {                                                                          \
        const char *got = history_current(h)->url;                                \
        if (strcmp(got, (expected)) != 0) {                                       \
            printf("  FAIL line %d: expected %s, got %s\n", __LINE__, (expected), got); \
            failures++;                                                           \
        }                                                                         \
    } while (0)

// AC #1: Back returns to the previous page.
static void test_back_returns_to_previous_page(void) {
    History *h = history_create("/home");
    history_visit(h, "/shoes");
    history_visit(h, "/cart");
    EXPECT(history_back(h));
    EXPECT_URL(h, "/shoes");
    EXPECT(history_back(h));
    EXPECT_URL(h, "/home");
    history_destroy(h);
}

// AC #2: Forward undoes a Back.
static void test_forward_undoes_back(void) {
    History *h = history_create("/home");
    history_visit(h, "/shoes");
    history_back(h);
    EXPECT(history_forward(h));
    EXPECT_URL(h, "/shoes");
    history_destroy(h);
}

// AC #3: visiting a new page clears Forward.
static void test_new_visit_clears_forward(void) {
    History *h = history_create("/home");
    history_visit(h, "/shoes");
    history_back(h);               // Forward now holds /shoes
    history_visit(h, "/sale");     // ...a new visit must throw it away
    EXPECT(!history_forward(h));
    EXPECT_URL(h, "/sale");
    history_destroy(h);
}

// AC #4: buttons are disabled when there is nowhere to go.
static void test_buttons_disabled_at_the_ends(void) {
    History *h = history_create("/home");
    EXPECT(!history_back(h));
    EXPECT(!history_forward(h));
    EXPECT_URL(h, "/home");        // and the page did not change
    history_destroy(h);
}

// Not in the ticket, but a reviewer would ask: what about a long session?
// 100 visits is far past the initial capacity of 8, so the stacks must grow
// (realloc inside GenericStack, from lesson 03) without losing pages.
static void test_long_session_grows_stacks(void) {
    History *h = history_create("/home");
    char url[32];
    for (int i = 0; i < 100; i++) {
        snprintf(url, sizeof url, "/page/%d", i);
        history_visit(h, url);
    }
    for (int i = 0; i < 100; i++) EXPECT(history_back(h));
    EXPECT_URL(h, "/home");
    history_destroy(h);
}

int main(void) {
    test_back_returns_to_previous_page();
    test_forward_undoes_back();
    test_new_visit_clears_forward();
    test_buttons_disabled_at_the_ends();
    test_long_session_grows_stacks();

    if (failures) {
        printf("WEB-142: %d check(s) FAILED\n", failures);
        return 1;   // non-zero exit code: CI marks the build red
    }
    printf("WEB-142: all acceptance tests passed\n");
    return 0;
}
