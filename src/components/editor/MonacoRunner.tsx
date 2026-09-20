import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { LessonId } from '../../branding/BrandHeader';
import { 
  Play, 
  FileCode, 
  CheckCircle, 
  Terminal, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  AlertTriangle,
  Folder,
  ChevronDown
} from 'lucide-react';

const AVL_INITIAL_FILES = {
  'avl_tree.h': `#ifndef AVL_TREE_H
#define AVL_TREE_H

#include <stdbool.h>

/**
 * Classroom Teaching Assistant (Classroom TA)
 * Lesson 01: AVL Tree Implementation in C (TDD Verified)
 */

typedef struct AVLNode {
    int key;
    int height;
    struct AVLNode* left;
    struct AVLNode* right;
} AVLNode;

// Allocation and Inspection
AVLNode* avl_create_node(int key);
int avl_height(const AVLNode* node);
int avl_balance_factor(const AVLNode* node);

// Core AVL Operations
AVLNode* avl_insert(AVLNode* root, int key);
AVLNode* avl_delete(AVLNode* root, int key);
const AVLNode* avl_find(const AVLNode* root, int key);
void avl_destroy(AVLNode* root);

// Rotations
AVLNode* avl_rotate_right(AVLNode* y);
AVLNode* avl_rotate_left(AVLNode* x);

// Parameterized Generation by Target Height
AVLNode* avl_create_by_height(int target_h);
void avl_print_ascii(const AVLNode* root);

#endif // AVL_TREE_H
`,

  'avl_tree.c': `#include <stdio.h>
#include <stdlib.h>
#include "avl_tree.h"

static int max_int(int a, int b) {
    return (a > b) ? a : b;
}

AVLNode* avl_create_node(int key) {
    AVLNode* node = (AVLNode*)malloc(sizeof(AVLNode));
    if (!node) {
        perror("Failed to allocate AVLNode");
        exit(EXIT_FAILURE);
    }
    node->key = key;
    node->height = 1;
    node->left = NULL;
    node->right = NULL;
    return node;
}

int avl_height(const AVLNode* node) {
    return node ? node->height : 0;
}

int avl_balance_factor(const AVLNode* node) {
    return node ? avl_height(node->left) - avl_height(node->right) : 0;
}

static void update_height(AVLNode* node) {
    if (node) {
        node->height = 1 + max_int(avl_height(node->left), avl_height(node->right));
    }
}

AVLNode* avl_rotate_right(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;

    x->right = y;
    y->left = T2;

    update_height(y);
    update_height(x);

    return x;
}

AVLNode* avl_rotate_left(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;

    y->left = x;
    x->right = T2;

    update_height(x);
    update_height(y);

    return y;
}

AVLNode* avl_insert(AVLNode* node, int key) {
    if (!node) return avl_create_node(key);

    if (key < node->key) {
        node->left = avl_insert(node->left, key);
    } else if (key > node->key) {
        node->right = avl_insert(node->right, key);
    } else {
        return node;
    }

    update_height(node);
    int balance = avl_balance_factor(node);

    // LL Case
    if (balance > 1 && key < node->left->key)
        return avl_rotate_right(node);

    // RR Case
    if (balance < -1 && key > node->right->key)
        return avl_rotate_left(node);

    // LR Case
    if (balance > 1 && key > node->left->key) {
        node->left = avl_rotate_left(node->left);
        return avl_rotate_right(node);
    }

    // RL Case
    if (balance < -1 && key < node->right->key) {
        node->right = avl_rotate_right(node->right);
        return avl_rotate_left(node);
    }

    return node;
}

static AVLNode* min_value_node(AVLNode* node) {
    AVLNode* current = node;
    while (current && current->left) current = current->left;
    return current;
}

AVLNode* avl_delete(AVLNode* root, int key) {
    if (!root) return root;

    if (key < root->key) {
        root->left = avl_delete(root->left, key);
    } else if (key > root->key) {
        root->right = avl_delete(root->right, key);
    } else {
        if (!root->left || !root->right) {
            AVLNode* temp = root->left ? root->left : root->right;
            if (!temp) {
                temp = root;
                root = NULL;
            } else {
                *root = *temp;
            }
            free(temp);
        } else {
            AVLNode* temp = min_value_node(root->right);
            root->key = temp->key;
            root->right = avl_delete(root->right, temp->key);
        }
    }

    if (!root) return root;

    update_height(root);
    int balance = avl_balance_factor(root);

    if (balance > 1 && avl_balance_factor(root->left) >= 0)
        return avl_rotate_right(root);

    if (balance > 1 && avl_balance_factor(root->left) < 0) {
        root->left = avl_rotate_left(root->left);
        return avl_rotate_right(root);
    }

    if (balance < -1 && avl_balance_factor(root->right) <= 0)
        return avl_rotate_left(root);

    if (balance < -1 && avl_balance_factor(root->right) > 0) {
        root->right = avl_rotate_right(root->right);
        return avl_rotate_left(root);
    }

    return root;
}

const AVLNode* avl_find(const AVLNode* root, int key) {
    if (!root || root->key == key) return root;
    if (key < root->key) return avl_find(root->left, key);
    return avl_find(root->right, key);
}

void avl_destroy(AVLNode* root) {
    if (!root) return;
    avl_destroy(root->left);
    avl_destroy(root->right);
    free(root);
}

static AVLNode* build_fib_avl(int h, int* counter) {
    if (h <= 0) return NULL;
    if (h == 1) {
        int key = (*counter)++;
        return avl_create_node(key * 10);
    }
    AVLNode* left = build_fib_avl(h - 1, counter);
    int key = (*counter)++;
    AVLNode* root = avl_create_node(key * 10);
    root->left = left;
    root->right = build_fib_avl(h - 2, counter);
    update_height(root);
    return root;
}

AVLNode* avl_create_by_height(int target_h) {
    if (target_h <= 0) return NULL;
    int counter = 1;
    return build_fib_avl(target_h, &counter);
}

static void print_ascii_helper(const AVLNode* root, int space) {
    const int COUNT = 6;
    if (!root) return;
    space += COUNT;
    print_ascii_helper(root->right, space);
    printf("\\n");
    for (int i = COUNT; i < space; i++) printf(" ");
    printf("[%d|h:%d|bf:%d]\\n", root->key, root->height, avl_balance_factor(root));
    print_ascii_helper(root->left, space);
}

void avl_print_ascii(const AVLNode* root) {
    printf("--- AVL Tree (ASCII Diagram: Right branch top, Left branch bottom) ---\\n");
    if (!root) {
        printf("  (empty tree)\\n");
    } else {
        print_ascii_helper(root, 0);
    }
    printf("----------------------------------------------------------------------\\n");
}
`,

  'demo_main.c': `#include <stdio.h>
#include <stdlib.h>
#include "avl_tree.h"

int main(int argc, char* argv[]) {
    printf("======================================================================\\n");
    printf("   CLASSROOM TEACHING ASSISTANT (Classroom TA) -- AVL Tree Demo\\n");
    printf("======================================================================\\n\\n");

    int target_h = 3;
    if (argc > 1) target_h = atoi(argv[1]);

    printf("1. Generating Minimal Fibonacci AVL Tree of Target Height: %d\\n", target_h);
    AVLNode* root = avl_create_by_height(target_h);
    avl_print_ascii(root);

    printf("\\n2. Live Insertion: Inserting key 35 into tree...\\n");
    root = avl_insert(root, 35);
    avl_print_ascii(root);

    printf("\\n3. Live Deletion: Deleting key 30 from tree...\\n");
    root = avl_delete(root, 30);
    avl_print_ascii(root);

    avl_destroy(root);
    printf("\\nAVL tree memory successfully freed. Ready for in-class questions!\\n");
    return 0;
}
`
};

const HASHMAP_INITIAL_FILES = {
  'hashmap.h': `#ifndef HASHMAP_H
#define HASHMAP_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Classroom Teaching Assistant (Classroom TA)
 * Lesson 02: Hash Map with Separate Chaining & Dynamic Rehashing
 */

typedef struct HashNode {
    char* key;
    int value;
    struct HashNode* next;
} HashNode;

typedef struct HashMap {
    HashNode** buckets;
    size_t capacity;
    size_t size;
    float max_load_factor;
} HashMap;

// Allocation and Destruction
HashMap* hashmap_create(size_t initial_capacity, float max_load_factor);
void hashmap_destroy(HashMap* map);

// Operations
bool hashmap_put(HashMap* map, const char* key, int value);
bool hashmap_get(const HashMap* map, const char* key, int* out_value);
bool hashmap_delete(HashMap* map, const char* key);
bool hashmap_contains(const HashMap* map, const char* key);

// Metrics
size_t hashmap_size(const HashMap* map);
size_t hashmap_capacity(const HashMap* map);
float hashmap_load_factor(const HashMap* map);
unsigned long hashmap_hash_djb2(const char* str);
void hashmap_print_ascii(const HashMap* map);

#endif // HASHMAP_H
`,

  'hashmap.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hashmap.h"

unsigned long hashmap_hash_djb2(const char* str) {
    unsigned long hash = 5381;
    int c;
    while ((c = (unsigned char)*str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

static char* custom_strdup(const char* s) {
    size_t len = strlen(s) + 1;
    char* copy = (char*)malloc(len);
    if (copy) memcpy(copy, s, len);
    return copy;
}

HashMap* hashmap_create(size_t initial_capacity, float max_load_factor) {
    if (initial_capacity == 0) initial_capacity = 8;
    if (max_load_factor <= 0.0f) max_load_factor = 0.75f;

    HashMap* map = (HashMap*)malloc(sizeof(HashMap));
    if (!map) return NULL;

    map->capacity = initial_capacity;
    map->size = 0;
    map->max_load_factor = max_load_factor;
    map->buckets = (HashNode**)calloc(map->capacity, sizeof(HashNode*));
    return map;
}

static bool hashmap_rehash(HashMap* map, size_t new_capacity) {
    HashNode** new_buckets = (HashNode**)calloc(new_capacity, sizeof(HashNode*));
    if (!new_buckets) return false;

    for (size_t i = 0; i < map->capacity; i++) {
        HashNode* curr = map->buckets[i];
        while (curr) {
            HashNode* next = curr->next;
            size_t new_idx = hashmap_hash_djb2(curr->key) % new_capacity;
            curr->next = new_buckets[new_idx];
            new_buckets[new_idx] = curr;
            curr = next;
        }
    }

    free(map->buckets);
    map->buckets = new_buckets;
    map->capacity = new_capacity;
    return true;
}

bool hashmap_put(HashMap* map, const char* key, int value) {
    if (!map || !key) return false;

    if ((float)(map->size + 1) / (float)map->capacity > map->max_load_factor) {
        hashmap_rehash(map, map->capacity * 2);
    }

    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            curr->value = value;
            return true;
        }
        curr = curr->next;
    }

    HashNode* new_node = (HashNode*)malloc(sizeof(HashNode));
    new_node->key = custom_strdup(key);
    new_node->value = value;
    new_node->next = map->buckets[index];
    map->buckets[index] = new_node;
    map->size++;
    return true;
}

bool hashmap_get(const HashMap* map, const char* key, int* out_value) {
    if (!map || !key) return false;
    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            if (out_value) *out_value = curr->value;
            return true;
        }
        curr = curr->next;
    }
    return false;
}

bool hashmap_delete(HashMap* map, const char* key) {
    if (!map || !key) return false;
    size_t index = hashmap_hash_djb2(key) % map->capacity;
    HashNode* curr = map->buckets[index];
    HashNode* prev = NULL;

    while (curr) {
        if (strcmp(curr->key, key) == 0) {
            if (prev) prev->next = curr->next;
            else map->buckets[index] = curr->next;
            free(curr->key);
            free(curr);
            map->size--;
            return true;
        }
        prev = curr;
        curr = curr->next;
    }
    return false;
}

bool hashmap_contains(const HashMap* map, const char* key) {
    return hashmap_get(map, key, NULL);
}

size_t hashmap_size(const HashMap* map) {
    return map ? map->size : 0;
}

size_t hashmap_capacity(const HashMap* map) {
    return map ? map->capacity : 0;
}

float hashmap_load_factor(const HashMap* map) {
    if (!map || map->capacity == 0) return 0.0f;
    return (float)map->size / (float)map->capacity;
}

void hashmap_destroy(HashMap* map) {
    if (!map) return;
    for (size_t i = 0; i < map->capacity; i++) {
        HashNode* curr = map->buckets[i];
        while (curr) {
            HashNode* next = curr->next;
            free(curr->key);
            free(curr);
            curr = next;
        }
    }
    free(map->buckets);
    free(map);
}

void hashmap_print_ascii(const HashMap* map) {
    printf("--- Hash Map Table: Capacity = %u, Size = %u, Load Factor = %.2f ---\\n",
           (unsigned int)map->capacity, (unsigned int)map->size, (double)hashmap_load_factor(map));

    for (size_t i = 0; i < map->capacity; i++) {
        printf("  [Bucket %2u]: ", (unsigned int)i);
        HashNode* curr = map->buckets[i];
        if (!curr) {
            printf("NULL\\n");
            continue;
        }
        while (curr) {
            printf("(%s: %d) -> ", curr->key, curr->value);
            curr = curr->next;
        }
        printf("NULL\\n");
    }
    printf("------------------------------------------------------------------------\\n");
}
`,

  'demo_hashmap.c': `#include <stdio.h>
#include <stdlib.h>
#include "hashmap.h"

int main(void) {
    printf("======================================================================\\n");
    printf("   CLASSROOM TEACHING ASSISTANT (Classroom TA) -- Hash Map Demo\\n");
    printf("======================================================================\\n\\n");

    printf("1. Creating Hash Map with initial capacity = 4, max_load_factor = 0.75\\n\\n");
    HashMap* map = hashmap_create(4, 0.75f);

    printf("2. Inserting 3 elements (apple, banana, cherry)...\\n");
    hashmap_put(map, "apple", 100);
    hashmap_put(map, "banana", 200);
    hashmap_put(map, "cherry", 300);
    hashmap_print_ascii(map);

    printf("\\n3. Inserting 4th element ('durian'):\\n");
    printf("   Load factor exceeds 0.75 -> Triggers dynamic table doubling to 8!\\n");
    hashmap_put(map, "durian", 400);
    hashmap_print_ascii(map);

    printf("\\n4. Deleting 'banana' from map...\\n");
    hashmap_delete(map, "banana");
    hashmap_print_ascii(map);

    hashmap_destroy(map);
    printf("\\nHash map memory freed successfully. Ready for classroom questions!\\n");
    return 0;
}
`
};

interface MonacoRunnerProps {
  lessonId: LessonId;
}

export const MonacoRunner: React.FC<MonacoRunnerProps> = ({ lessonId }) => {
  const isAVL = lessonId === '01-avl-trees';
  const initialFiles = isAVL ? AVL_INITIAL_FILES : HASHMAP_INITIAL_FILES;
  const fileKeys = Object.keys(initialFiles);

  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>(fileKeys[1]); // default to .c file
  const [output, setOutput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'compile_error' | 'runtime_error'>('idle');
  const [copied, setCopied] = useState<boolean>(false);
  const [exampleCategories, setExampleCategories] = useState<any[]>([]);
  const [isExamplesMenuOpen, setIsExamplesMenuOpen] = useState<boolean>(false);
  const [activeExamplePath, setActiveExamplePath] = useState<string | null>(null);
  const [exampleFiles, setExampleFiles] = useState<Record<string, string>>({});

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Load code examples from /api/code-examples
  useEffect(() => {
    fetch('/api/code-examples')
      .then(res => res.json())
      .then(data => {
        if (data.categories) setExampleCategories(data.categories);
      })
      .catch(err => console.error('Failed to load code examples:', err));
  }, []);

  const handleSelectExample = async (relativePath: string) => {
    try {
      setIsExamplesMenuOpen(false);
      const res = await fetch(`/api/code-examples?file=${encodeURIComponent(relativePath)}`);
      const data = await res.json();
      if (data.exists) {
        setActiveExamplePath(relativePath);
        setExampleFiles(prev => ({ ...prev, [relativePath]: data.content }));
        setOutput('');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Failed to load example file:', err);
    }
  };

  const handleSelectLessonFile = (fileKey: string) => {
    setActiveExamplePath(null);
    setActiveFile(fileKey);
    setOutput('');
    setStatus('idle');
  };

  // Switch lesson files when lessonId changes
  useEffect(() => {
    const newFiles = isAVL ? AVL_INITIAL_FILES : HASHMAP_INITIAL_FILES;
    setFiles(newFiles);
    const keys = Object.keys(newFiles);
    setActiveFile(keys[1]);
    setActiveExamplePath(null);
    setOutput('');
    setStatus('idle');
  }, [lessonId, isAVL]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.remeasureFonts();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
    editor.onDidFocusEditorText(() => {
      monaco.editor.remeasureFonts();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      if (activeExamplePath) {
        setExampleFiles(prev => ({
          ...prev,
          [activeExamplePath]: value
        }));
      } else {
        setFiles(prev => ({
          ...prev,
          [activeFile]: value
        }));
      }
    }
  };

  const handleResetCode = () => {
    if (activeExamplePath) {
      handleSelectExample(activeExamplePath);
      return;
    }
    setFiles(prev => ({
      ...prev,
      [activeFile]: initialFiles[activeFile as keyof typeof initialFiles]
    }));
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'gcc', []);
    }
    setOutput('');
    setStatus('idle');
  };

  const handleRun = async () => {
    setStatus('running');

    // Branch 1: Standalone Code Example execution from code_examples/
    if (activeExamplePath) {
      setOutput(`$ gcc -Wall -Wextra ${activeExamplePath} -o example.exe\nCompiling example with GCC...\n`);
      try {
        await fetch('/api/code-examples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: activeExamplePath, content: exampleFiles[activeExamplePath] || '' })
        });

        const res = await fetch('/api/code-examples/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: activeExamplePath })
        });
        const result = await res.json();
        setOutput(result.output);
        setStatus(result.success ? 'success' : (result.phase === 'compilation' ? 'compile_error' : 'runtime_error'));
      } catch (err: any) {
        setStatus('compile_error');
        setOutput(`[RUNNER ERROR] ${err.message}`);
      }
      return;
    }

    // Branch 2: Lesson Code execution
    const mainFile = isAVL ? 'demo_main.c' : 'demo_hashmap.c';
    const cFile = isAVL ? 'avl_tree.c' : 'hashmap.c';

    setOutput(`$ gcc -Wall -Wextra ${mainFile} ${cFile} -o demo.exe\nCompiling with real GCC 13.2 compiler...\n`);

    try {
      const res = await fetch('/api/run-c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, lessonId })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      setOutput(result.output);

      if (!result.success) {
        if (result.phase === 'compilation') {
          setStatus('compile_error');
          if (monacoRef.current && editorRef.current) {
            const raw = result.rawError || '';
            const markers: any[] = [];
            const regex = /([a-zA-Z0-9_\-\.]+):(\d+):(\d+):\s*(error|warning):\s*(.*)/g;
            let match;
            while ((match = regex.exec(raw)) !== null) {
              const [, file, line, col, severity, msg] = match;
              if (file === activeFile) {
                markers.push({
                  startLineNumber: parseInt(line),
                  startColumn: parseInt(col),
                  endLineNumber: parseInt(line),
                  endColumn: parseInt(col) + 10,
                  message: `${severity.toUpperCase()}: ${msg}`,
                  severity: severity === 'error' ? monacoRef.current.MarkerSeverity.Error : monacoRef.current.MarkerSeverity.Warning
                });
              }
            }
            monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'gcc', markers);
          }
        } else {
          setStatus('runtime_error');
        }
      } else {
        setStatus('success');
        if (monacoRef.current && editorRef.current) {
          monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'gcc', []);
        }
      }
    } catch (err: any) {
      setStatus('compile_error');
      setOutput(
`[LOCAL COMPILATION RUNNER ERROR]
Could not connect to the local GCC compiler endpoint (/api/run-c).
Ensure 'npm run dev' is running.

Details: ${err.message}`
      );
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(files[activeFile] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-4 gap-4 select-none">
      {/* Top File & Compilation Control Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {fileKeys.map(fk => (
              <button
                key={fk}
                onClick={() => handleSelectLessonFile(fk)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-mono transition font-medium ${
                  !activeExamplePath && activeFile === fk ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {fk}
              </button>
            ))}
          </div>

          {/* Standalone Code Examples Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExamplesMenuOpen(!isExamplesMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition font-mono font-medium ${
                activeExamplePath
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeExamplePath ? activeExamplePath : 'Code Examples'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isExamplesMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                  Fixed Code Examples
                </div>
                <div className="max-h-56 overflow-y-auto mt-1 space-y-2">
                  {exampleCategories.map(cat => (
                    <div key={cat.category}>
                      <div className="text-[11px] font-bold text-slate-400 px-2 py-0.5 uppercase">
                        {cat.category}
                      </div>
                      {cat.files.map((f: any) => (
                        <button
                          key={f.relativePath}
                          onClick={() => handleSelectExample(f.relativePath)}
                          className={`w-full text-left px-2.5 py-1 text-xs font-mono rounded-md flex items-center gap-2 transition ${
                            activeExamplePath === f.relativePath
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <FileCode className="w-3 h-3 text-emerald-400" />
                          <span>{f.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-xs text-indigo-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {activeExamplePath ? 'Standalone Example' : `Live GCC Compiler (${isAVL ? 'AVL Trees' : 'Hash Maps'})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'compile_error' && (
            <span className="flex items-center gap-1 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" />
              Syntax Error (Build Failed)
            </span>
          )}
          {status === 'runtime_error' && (
            <span className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" />
              Runtime Error
            </span>
          )}
          {status === 'success' && (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              Build & Run Succeeded
            </span>
          )}

          <button
            onClick={handleResetCode}
            title="Reset active file to default code"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Code
          </button>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleRun}
            disabled={status === 'running'}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {status === 'running' ? 'Compiling (GCC)...' : 'Compile & Run (GCC)'}
          </button>
        </div>
      </div>

      {/* Editor & Terminal Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Monaco Code Editor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="h-9 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-indigo-300 font-medium">
              Editing: {activeExamplePath || activeFile}
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
              Pure C • In-Browser Editable
            </span>
          </div>

          <div className="flex-1 w-full h-full overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="c"
              language="c"
              value={activeExamplePath ? (exampleFiles[activeExamplePath] || '') : (files[activeFile] || '')}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 13,
                lineHeight: 20,
                letterSpacing: 0,
                fontLigatures: false,
                fontFamily: "Consolas, 'Fira Code', 'Courier New', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>
        </div>

        {/* Classroom Execution Terminal */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="h-9 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono">Real Compiler & Execution Terminal</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
              status === 'compile_error' ? 'bg-rose-500/20 text-rose-300' :
              status === 'runtime_error' ? 'bg-amber-500/20 text-amber-300' :
              status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-slate-800 text-slate-400'
            }`}>
              {status === 'compile_error' ? 'COMPILATION ERROR' :
               status === 'runtime_error' ? 'RUNTIME ERROR' :
               status === 'success' ? 'SUCCESS (0)' : 'READY'}
            </span>
          </div>
          <div className={`flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed whitespace-pre ${
            status === 'compile_error' ? 'bg-[#180a0a] text-rose-300' :
            status === 'runtime_error' ? 'bg-[#18120a] text-amber-300' :
            'bg-[#0a0e17] text-emerald-400'
          }`}>
            {output || (
              <span className="text-slate-600">
                Click "Compile & Run (GCC)" to invoke the native compiler on {activeFile}.
                Syntax errors and runtime outputs will display here.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
