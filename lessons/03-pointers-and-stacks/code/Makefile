CC = gcc
CFLAGS = -Wall -Wextra -g -std=c11

all: demo.exe test_stacks.exe

demo.exe: demo_main.c int_stack.c generic_stack.c
	$(CC) $(CFLAGS) demo_main.c int_stack.c generic_stack.c -o demo.exe

test_stacks.exe: test_stacks.c int_stack.c generic_stack.c
	$(CC) $(CFLAGS) test_stacks.c int_stack.c generic_stack.c -o test_stacks.exe

test: test_stacks.exe
	.\test_stacks.exe

clean:
	rm -f *.exe *.o
