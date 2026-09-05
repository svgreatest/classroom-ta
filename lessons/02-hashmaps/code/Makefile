CC = gcc
CFLAGS = -Wall -Wextra -g -O2

all: demo.exe test_hashmap.exe

demo.exe: demo_hashmap.c hashmap.c hashmap.h
	$(CC) $(CFLAGS) demo_hashmap.c hashmap.c -o demo.exe

test_hashmap.exe: test_hashmap.c hashmap.c hashmap.h
	$(CC) $(CFLAGS) test_hashmap.c hashmap.c -o test_hashmap.exe

test: test_hashmap.exe
	./test_hashmap.exe

clean:
	rm -f *.exe *.o

.PHONY: all test clean
