#ifndef BROWSER_HISTORY_H
#define BROWSER_HISTORY_H

/*
 * WEB-142: Back / Forward buttons for the in-app browser.
 *
 * This header is the INTERFACE of our feature: the only thing the rest of
 * the app (the UI code that draws the buttons) needs to read. It says WHAT
 * the module does, not HOW. The "how" lives in browser_history.c.
 */

#include <stdbool.h>

/*
 * One entry in the history. We store it BY VALUE inside the stacks:
 * GenericStack copies sizeof(Page) bytes on every push, so Page must not
 * contain pointers to memory that could be freed later. A fixed-size char
 * array keeps it self-contained.
 */
typedef struct {
    char url[64];
    int  scroll_y;      // where the reader was on the page, restored on Back
} Page;

/*
 * "Opaque type": callers can hold a History* but cannot see inside it.
 * That lets us change the internals (e.g. swap the stacks for something
 * else) without breaking any code that uses this header.
 */
typedef struct History History;

// Start a session on the home page. Returns NULL if memory runs out.
History *history_create(const char *home_url);

// The user clicked a link: go to a new page.
void history_visit(History *h, const char *url);

// The Back / Forward buttons. Return false when there is nowhere to go,
// which the UI uses to grey the button out (acceptance criterion #4).
bool history_back(History *h);
bool history_forward(History *h);

// The page currently on screen. The pointer stays valid until the next call.
const Page *history_current(const History *h);

// End the session and free everything history_create allocated.
void history_destroy(History *h);

#endif // BROWSER_HISTORY_H
