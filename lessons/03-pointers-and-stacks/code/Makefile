CC = gcc

# Warnings: catch pointer and type mistakes at compile time
WARNINGS = -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion \
           -Wnull-dereference -Wformat=2
CFLAGS = $(WARNINGS) -g -std=c11 -O0

# Runtime checks: out-of-bounds, use-after-free, undefined behaviour.
# Needs Linux, macOS or WSL (MinGW gcc on Windows ships without these libraries).
# Usage: make clean && make SANITIZE=1
ifeq ($(SANITIZE),1)
CFLAGS += -fsanitize=address,undefined -fno-omit-frame-pointer
endif

.PHONY: all demo test_stacks test clean

all: demo.exe test_stacks.exe

# Short names: "make demo" / "make test_stacks" (otherwise make's built-in rule
# compiles test_stacks.c alone and the link fails)
demo: demo.exe
test_stacks: test_stacks.exe

demo.exe: demo_main.c int_stack.c generic_stack.c
	$(CC) $(CFLAGS) demo_main.c int_stack.c generic_stack.c -o demo.exe

test_stacks.exe: test_stacks.c int_stack.c generic_stack.c
	$(CC) $(CFLAGS) test_stacks.c int_stack.c generic_stack.c -o test_stacks.exe

test: test_stacks.exe
	.\test_stacks.exe

clean:
	rm -f *.exe *.o *.gch
