/*
 * A scripted click-through of the finished feature, the way you would demo
 * it to the product manager before closing the ticket.
 *
 * Build and run:  mingw32-make demo
 */

#include "browser_history.h"
#include <stdio.h>

// Print what the user did and which page is now on screen.
static void show(const char *action, History *h) {
    printf("%-16s -> now on %s\n", action, history_current(h)->url);
}

int main(void) {
    History *h = history_create("/home");
    if (!h) return 1;
    show("open app", h);

    history_visit(h, "/shoes");  show("visit /shoes", h);
    history_visit(h, "/cart");   show("visit /cart", h);
    history_back(h);             show("Back", h);
    history_back(h);             show("Back", h);
    history_forward(h);          show("Forward", h);
    history_visit(h, "/sale");   show("visit /sale", h);   // clears Forward

    // history_forward returns false here, so the UI would grey the button out.
    printf("%-16s -> %s\n", "Forward",
           history_forward(h) ? "moved" : "disabled (nothing ahead)");

    history_destroy(h);
    return 0;
}
