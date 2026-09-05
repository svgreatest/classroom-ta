CC = gcc
CFLAGS = -Wall -Wextra -g -O2

all: demo.exe test_avl.exe

demo.exe: demo_main.c avl_tree.c avl_tree.h
	$(CC) $(CFLAGS) demo_main.c avl_tree.c -o demo.exe

test_avl.exe: test_avl.c avl_tree.c avl_tree.h
	$(CC) $(CFLAGS) test_avl.c avl_tree.c -o test_avl.exe

test: test_avl.exe
	./test_avl.exe

clean:
	rm -f *.exe *.o

.PHONY: all test clean
