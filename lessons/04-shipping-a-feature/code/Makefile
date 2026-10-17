CC = gcc
CFLAGS = -Wall -Wextra -g -std=c11

# We REUSE the GenericStack library from lesson 03 instead of copying it.
# -I tells the compiler where to find generic_stack.h.
LIB = ../../03-pointers-and-stacks/code
CFLAGS += -I$(LIB)

FEATURE = browser_history.c $(LIB)/generic_stack.c

all: demo_browser.exe test_history.exe

demo_browser.exe: demo_browser.c $(FEATURE) browser_history.h
	$(CC) $(CFLAGS) demo_browser.c $(FEATURE) -o demo_browser.exe

test_history.exe: test_history.c $(FEATURE) browser_history.h
	$(CC) $(CFLAGS) test_history.c $(FEATURE) -o test_history.exe

test: test_history.exe
	.\test_history.exe

demo: demo_browser.exe
	.\demo_browser.exe

clean:
	rm -f *.exe *.o
