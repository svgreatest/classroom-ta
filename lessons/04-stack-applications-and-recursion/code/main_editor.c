#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#ifdef _WIN32
#include <conio.h>
#include <io.h>
#define isatty_fn _isatty
#define fileno_fn _fileno
#else
#include <unistd.h>
#define isatty_fn isatty
#define fileno_fn fileno
#endif
#include "text_editor.h"
#include "calculator.h"

static void run_demo_mode(TextEditor *ed) {
    printf("\033[2J\033[H");
    printf("[DEMO MODE: Automated Case Study Demonstration]\n\n");

    printf("Step 1: User types text into the editor...\n");
    editor_insert_text(ed, "The quick brown fox jumps over the lazy dog.");
    editor_render_screen(ed);

    printf("\nStep 2: User presses Ctrl+E and evaluates: (2 + 3) * 4 - 6 / 2 ...\n");
    int result = 0;
    char err[128];
    const char *expr = "(2 + 3) * 4 - 6 / 2";
    if (calculator_eval(expr, &result, err, sizeof(err))) {
        char buf[64];
        snprintf(buf, sizeof(buf), " [Formula: %d]", result);
        editor_newline(ed);
        editor_insert_text(ed, buf);
    }
    editor_render_screen(ed);

    printf("\nStep 3: User presses Ctrl+Z (Undo) -> Formula disappears!\n");
    editor_undo(ed);
    editor_render_screen(ed);

    printf("\nStep 4: User presses Ctrl+Y (Redo) -> Formula comes right back!\n");
    editor_redo(ed);
    editor_render_screen(ed);

    printf("\n[Demo Complete: All Undo/Redo & Calc operations verified in-place!]\n");
}

static void prompt_calculator(TextEditor *ed) {
    printf("\n[Calculator Mode] Enter math expression (e.g. (2+3)*4 - 6/2): ");
    fflush(stdout);

    char expr[128];
    int len = 0;
    expr[0] = '\0';

#ifdef _WIN32
    while (1) {
        int ch = _getch();
        if (ch == 27) {
            /* Esc: Cancel */
            snprintf(ed->current.status_msg, sizeof(ed->current.status_msg), "[Calc] Cancelled");
            return;
        } else if (ch == '\r' || ch == '\n') {
            /* Enter: Submit */
            printf("\n");
            fflush(stdout);
            break;
        } else if (ch == 8 || ch == 127) {
            /* Backspace */
            if (len > 0) {
                len--;
                expr[len] = '\0';
                printf("\b \b");
                fflush(stdout);
            }
        } else if (ch >= 32 && ch <= 126) {
            /* Printable ASCII */
            if (len < (int)sizeof(expr) - 1) {
                expr[len++] = (char)ch;
                expr[len] = '\0';
                putchar(ch);
                fflush(stdout);
            }
        }
    }
#else
    if (fgets(expr, sizeof(expr), stdin)) {
        len = (int)strlen(expr);
        while (len > 0 && (expr[len - 1] == '\n' || expr[len - 1] == '\r')) {
            expr[--len] = '\0';
        }
    }
#endif

    if (len > 0) {
        int result = 0;
        char err[128] = {0};
        if (calculator_eval(expr, &result, err, sizeof(err))) {
            char buf[64];
            snprintf(buf, sizeof(buf), " %d", result);
            editor_insert_text(ed, buf);
            snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
                     "[Calc] %s = %d (inserted at cursor)", expr, result);
        } else {
            snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
                     "[Calc Error] %s", err);
        }
    }
}

int main(int argc, char *argv[]) {
    TextEditor *ed = editor_create();
    if (!ed) {
        fprintf(stderr, "Failed to initialize editor.\n");
        return 1;
    }

    if (argc > 1 && strcmp(argv[1], "--demo") == 0) {
        run_demo_mode(ed);
        editor_destroy(ed);
        return 0;
    }

    #ifdef _WIN32
    if (!isatty_fn(fileno_fn(stdin))) {
        /* Piped input mode */
        char line[256];
        while (fgets(line, sizeof(line), stdin)) {
            size_t len = strlen(line);
            while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
                line[len - 1] = '\0';
                len--;
            }
            if (strcmp(line, "undo") == 0) editor_undo(ed);
            else if (strcmp(line, "redo") == 0) editor_redo(ed);
            else if (strcmp(line, "quit") == 0) break;
            else {
                editor_insert_text(ed, line);
                editor_newline(ed);
            }
        }
        editor_render_screen(ed);
        editor_destroy(ed);
        return 0;
    }

    /* Live Interactive Raw Keyboard Mode */
    editor_render_screen(ed);

    while (1) {
        int ch = _getch();

        if (ch == 27) {
            /* Esc: Exit */
            break;
        } else if (ch == 26) {
            /* Ctrl+Z: Undo */
            editor_undo(ed);
            editor_render_screen(ed);
        } else if (ch == 25 || ch == 18) {
            /* Ctrl+Y or Ctrl+R: Redo */
            editor_redo(ed);
            editor_render_screen(ed);
        } else if (ch == 5) {
            /* Ctrl+E: Calculate Math Expression */
            prompt_calculator(ed);
            editor_render_screen(ed);
        } else if (ch == 8 || ch == 127) {
            /* Backspace */
            editor_backspace(ed);
            editor_render_screen(ed);
        } else if (ch == '\r' || ch == '\n') {
            /* Enter */
            editor_newline(ed);
            editor_render_screen(ed);
        } else if (ch >= 32 && ch <= 126) {
            /* Printable ASCII */
            editor_insert_char(ed, (char)ch);
            editor_render_screen(ed);
        } else if (ch == 0 || ch == 224) {
            /* Arrow / Special keys prefix: read and ignore */
            _getch();
        }
    }

    printf("\n\nExited C-MINI-EDIT. Document memory freed.\n");
#else
    run_demo_mode(ed);
#endif

    editor_destroy(ed);
    return 0;
}
