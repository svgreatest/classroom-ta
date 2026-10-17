/*
 * WEB-142 implementation.
 *
 * Notice what is NOT in this file: there is no stack code. No malloc of an
 * array, no realloc, no top index. We REUSE the GenericStack library from
 * lesson 03 through its interface (generic_stack.h) and only write the
 * part that is specific to our feature.
 */

#include "browser_history.h"
#include "generic_stack.h"   // the shared library: create / push / pop / destroy
#include <stdio.h>
#include <stdlib.h>

/*
 * The hidden layout behind the opaque History type.
 *
 *          back stack           current          forward stack
 *        (pages behind us)   (on screen now)   (pages we came Back from)
 *          [ /home  ]
 *          [ /shoes ] <-top     /cart              (empty)
 */
struct History {
    GenericStack *back;
    GenericStack *forward;
    Page current;
};

// Build a Page from a URL. snprintf never writes past url[63], even if the
// URL is longer: it truncates and always adds the terminating '\0'.
static Page make_page(const char *url) {
    Page p = { .scroll_y = 0 };
    snprintf(p.url, sizeof p.url, "%s", url);
    return p;
}

History *history_create(const char *home_url) {
    History *h = malloc(sizeof *h);
    if (!h) return NULL;

    // Two independent stacks from the SAME library: code reuse in action.
    // We tell the library our element size once; it never needs to know
    // what a Page is.
    h->back    = generic_stack_create(sizeof(Page), 8);
    h->forward = generic_stack_create(sizeof(Page), 8);

    // If either allocation failed, undo everything we did so far.
    // (generic_stack_destroy(NULL) is safe, so we can call it on both.)
    if (!h->back || !h->forward) {
        generic_stack_destroy(h->back);
        generic_stack_destroy(h->forward);
        free(h);
        return NULL;
    }

    h->current = make_page(home_url);
    return h;
}

void history_visit(History *h, const char *url) {
    // 1. The page we are leaving goes on the Back stack.
    //    push copies the whole Page struct, so h->current can be reused.
    generic_stack_push(h->back, &h->current);

    // 2. Show the new page.
    h->current = make_page(url);

    // 3. A new visit starts a new "branch" of history, so Forward no longer
    //    makes sense (acceptance criterion #3). The library has no clear()
    //    function, so we build one from what it does offer: pop until empty.
    //    Passing NULL tells pop "I don't need the value, just remove it".
    while (generic_stack_pop(h->forward, NULL)) {
        // keep popping
    }
}

bool history_back(History *h) {
    Page prev;

    // Nothing behind us? Then Back is disabled: report false, change nothing.
    if (!generic_stack_pop(h->back, &prev)) return false;

    // Where we are now becomes somewhere we can go Forward to...
    generic_stack_push(h->forward, &h->current);

    // ...and we step back to the page we just popped.
    h->current = prev;
    return true;
}

// The mirror image of history_back: same three steps, stacks swapped.
bool history_forward(History *h) {
    Page next;
    if (!generic_stack_pop(h->forward, &next)) return false;
    generic_stack_push(h->back, &h->current);
    h->current = next;
    return true;
}

const Page *history_current(const History *h) {
    return &h->current;
}

void history_destroy(History *h) {
    if (!h) return;
    // Every create needs exactly one destroy: two stacks, then the History.
    generic_stack_destroy(h->back);
    generic_stack_destroy(h->forward);
    free(h);
}
