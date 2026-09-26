#include "text_editor.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void clear_stack(GenericStack *s) {
    EditorState dummy;
    while (stack_pop(s, &dummy));
}

TextEditor* editor_create(void) {
    TextEditor *ed = (TextEditor*)calloc(1, sizeof(TextEditor));
    if (!ed) return NULL;

    ed->current.line_count = 1;
    ed->current.cursor_row = 0;
    ed->current.cursor_col = 0;
    ed->current.lines[0][0] = '\0';
    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "Type text | Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+E: Calc | Esc: Quit");

    ed->undo_stack = stack_create(sizeof(EditorState), 64);
    ed->redo_stack = stack_create(sizeof(EditorState), 64);

    return ed;
}

void editor_destroy(TextEditor *ed) {
    if (!ed) return;
    stack_destroy(ed->undo_stack);
    stack_destroy(ed->redo_stack);
    free(ed);
}

void editor_record_snapshot(TextEditor *ed) {
    if (!ed) return;
    stack_push(ed->undo_stack, &ed->current);
    clear_stack(ed->redo_stack);
}

bool editor_undo(TextEditor *ed) {
    if (!ed || stack_is_empty(ed->undo_stack)) {
        snprintf(ed->current.status_msg, sizeof(ed->current.status_msg), "Nothing to undo. (Undo stack is empty)");
        return false;
    }

    /* Push current state to redo stack before reverting */
    stack_push(ed->redo_stack, &ed->current);

    /* Pop previous state from undo stack */
    stack_pop(ed->undo_stack, &ed->current);

    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "[Undo] Reverted to previous edit (Undo stack: %d | Redo stack: %d)",
             stack_size(ed->undo_stack), stack_size(ed->redo_stack));
    return true;
}

bool editor_redo(TextEditor *ed) {
    if (!ed || stack_is_empty(ed->redo_stack)) {
        snprintf(ed->current.status_msg, sizeof(ed->current.status_msg), "Nothing to redo. (Redo stack is empty)");
        return false;
    }

    /* Push current state to undo stack before re-applying */
    stack_push(ed->undo_stack, &ed->current);

    /* Pop state from redo stack */
    stack_pop(ed->redo_stack, &ed->current);

    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "[Redo] Restored undone edit (Undo stack: %d | Redo stack: %d)",
             stack_size(ed->undo_stack), stack_size(ed->redo_stack));
    return true;
}

void editor_insert_char(TextEditor *ed, char c) {
    if (!ed) return;

    editor_record_snapshot(ed);

    int row = ed->current.cursor_row;
    int col = ed->current.cursor_col;

    if (row >= MAX_LINES) return;

    int len = (int)strlen(ed->current.lines[row]);
    if (len >= LINE_CAPACITY - 2) return;

    if (col > len) col = len;

    /* Shift right to make room */
    for (int i = len; i >= col; i--) {
        ed->current.lines[row][i + 1] = ed->current.lines[row][i];
    }
    ed->current.lines[row][col] = c;
    ed->current.cursor_col++;

    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "Typing... (Undo stack: %d)", stack_size(ed->undo_stack));
}

void editor_backspace(TextEditor *ed) {
    if (!ed) return;

    int row = ed->current.cursor_row;
    int col = ed->current.cursor_col;

    if (col > 0) {
        editor_record_snapshot(ed);
        int len = (int)strlen(ed->current.lines[row]);
        for (int i = col - 1; i < len; i++) {
            ed->current.lines[row][i] = ed->current.lines[row][i + 1];
        }
        ed->current.cursor_col--;
        snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
                 "Backspace. (Undo stack: %d)", stack_size(ed->undo_stack));
    } else if (row > 0) {
        editor_record_snapshot(ed);
        /* Merge with previous line */
        int prev_len = (int)strlen(ed->current.lines[row - 1]);
        int curr_len = (int)strlen(ed->current.lines[row]);
        if (prev_len + curr_len < LINE_CAPACITY - 1) {
            strcat(ed->current.lines[row - 1], ed->current.lines[row]);
            for (int i = row; i < ed->current.line_count - 1; i++) {
                strcpy(ed->current.lines[i], ed->current.lines[i + 1]);
            }
            ed->current.line_count--;
            ed->current.cursor_row = row - 1;
            ed->current.cursor_col = prev_len;
        }
        snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
                 "Merged line. (Undo stack: %d)", stack_size(ed->undo_stack));
    }
}

void editor_newline(TextEditor *ed) {
    if (!ed) return;
    if (ed->current.line_count >= MAX_LINES) return;

    editor_record_snapshot(ed);

    int row = ed->current.cursor_row;
    int col = ed->current.cursor_col;

    /* Shift lines down */
    for (int i = ed->current.line_count; i > row + 1; i--) {
        strcpy(ed->current.lines[i], ed->current.lines[i - 1]);
    }

    /* Cut remainder of current line to new line */
    strcpy(ed->current.lines[row + 1], &ed->current.lines[row][col]);
    ed->current.lines[row][col] = '\0';

    ed->current.line_count++;
    ed->current.cursor_row++;
    ed->current.cursor_col = 0;

    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "New line added. (Undo stack: %d)", stack_size(ed->undo_stack));
}

void editor_insert_text(TextEditor *ed, const char *text) {
    if (!ed || !text) return;

    editor_record_snapshot(ed);

    int row = ed->current.cursor_row;
    int len = (int)strlen(ed->current.lines[row]);
    int add_len = (int)strlen(text);

    if (len + add_len < LINE_CAPACITY - 1) {
        strcat(ed->current.lines[row], text);
        ed->current.cursor_col = (int)strlen(ed->current.lines[row]);
    }

    snprintf(ed->current.status_msg, sizeof(ed->current.status_msg),
             "Inserted \"%s\". (Undo stack: %d)", text, stack_size(ed->undo_stack));
}

void editor_render_screen(const TextEditor *ed) {
    if (!ed) return;

    /* Clear screen and move cursor home: ANSI escape sequence */
    printf("\033[2J\033[H");

    printf("========================================================================\n");
    printf("  C-MINI-EDIT : Interactive Text Editor & Calculator (Dual-Stack ADT)   \n");
    printf("  Shortcuts:  [Ctrl+Z] Undo  |  [Ctrl+Y] Redo  |  [Ctrl+E] Calc  |  [Esc] Quit\n");
    printf("========================================================================\n\n");

    for (int i = 0; i < ed->current.line_count; i++) {
        bool is_cursor_line = (i == ed->current.cursor_row);
        printf(" %2d | %s%s\n",
               i + 1,
               ed->current.lines[i],
               is_cursor_line ? "_" : "");
    }

    if (ed->current.line_count == 1 && ed->current.lines[0][0] == '\0') {
        printf("    (Type anything to begin writing...)\n");
    }

    printf("\n------------------------------------------------------------------------\n");
    printf(" Status: %s\n", ed->current.status_msg);
    printf(" History: Undo Stack = %d actions  |  Redo Stack = %d actions\n",
           stack_size(ed->undo_stack), stack_size(ed->redo_stack));
    printf("========================================================================\n");
    fflush(stdout);
}
