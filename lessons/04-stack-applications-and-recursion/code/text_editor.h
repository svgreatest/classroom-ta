#ifndef TEXT_EDITOR_H
#define TEXT_EDITOR_H

#include <stdbool.h>
#include <stddef.h>
#include "generic_stack.h"

#define MAX_LINES 32
#define LINE_CAPACITY 128

typedef struct {
    char lines[MAX_LINES][LINE_CAPACITY];
    int line_count;
    int cursor_row;
    int cursor_col;
    char status_msg[128];
} EditorState;

typedef struct {
    EditorState current;
    GenericStack *undo_stack; /* Stack of EditorState */
    GenericStack *redo_stack; /* Stack of EditorState */
} TextEditor;

/* Lifecycle */
TextEditor* editor_create(void);
void        editor_destroy(TextEditor *ed);

/* State snapshot & history */
void editor_record_snapshot(TextEditor *ed);
bool editor_undo(TextEditor *ed);
bool editor_redo(TextEditor *ed);

/* Direct edits */
void editor_insert_char(TextEditor *ed, char c);
void editor_backspace(TextEditor *ed);
void editor_newline(TextEditor *ed);
void editor_insert_text(TextEditor *ed, const char *text);

/* Screen rendering */
void editor_render_screen(const TextEditor *ed);

#endif /* TEXT_EDITOR_H */
