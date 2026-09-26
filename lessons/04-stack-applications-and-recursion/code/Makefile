CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -pedantic -O2

# All 8 curriculum programs + the interactive case study Text Editor + Generic Stack ADT
TARGETS = 01_reverse_list.exe \
          02_parentheses_checker.exe \
          03_infix_to_postfix.exe \
          04_eval_postfix.exe \
          05_infix_to_prefix.exe \
          06_eval_prefix.exe \
          07_recursion_simulation.exe \
          08_tower_of_hanoi.exe \
          editor.exe

all: $(TARGETS)

# Reusable Generic Stack object
generic_stack.o: generic_stack.c generic_stack.h
	$(CC) $(CFLAGS) -c generic_stack.c -o generic_stack.o

# Modular Calculator Engine
calculator.o: calculator.c calculator.h generic_stack.h
	$(CC) $(CFLAGS) -c calculator.c -o calculator.o

# Modular Text Editor Core
text_editor.o: text_editor.c text_editor.h generic_stack.h
	$(CC) $(CFLAGS) -c text_editor.c -o text_editor.o

# Case Study: Terminal Text Editor with Undo/Redo & Inline Calculator
editor.exe: main_editor.c text_editor.o calculator.o generic_stack.o
	$(CC) $(CFLAGS) main_editor.c text_editor.o calculator.o generic_stack.o -o editor.exe

################################################################################################################################


01_reverse_list.exe: 01_reverse_list.c generic_stack.o
	$(CC) $(CFLAGS) 01_reverse_list.c generic_stack.o -o 01_reverse_list.exe

02_parentheses_checker.exe: 02_parentheses_checker.c generic_stack.o
	$(CC) $(CFLAGS) 02_parentheses_checker.c generic_stack.o -o 02_parentheses_checker.exe

03_infix_to_postfix.exe: 03_infix_to_postfix.c generic_stack.o
	$(CC) $(CFLAGS) 03_infix_to_postfix.c generic_stack.o -o 03_infix_to_postfix.exe

04_eval_postfix.exe: 04_eval_postfix.c generic_stack.o
	$(CC) $(CFLAGS) 04_eval_postfix.c generic_stack.o -o 04_eval_postfix.exe

05_infix_to_prefix.exe: 05_infix_to_prefix.c generic_stack.o
	$(CC) $(CFLAGS) 05_infix_to_prefix.c generic_stack.o -o 05_infix_to_prefix.exe

06_eval_prefix.exe: 06_eval_prefix.c generic_stack.o
	$(CC) $(CFLAGS) 06_eval_prefix.c generic_stack.o -o 06_eval_prefix.exe

07_recursion_simulation.exe: 07_recursion_simulation.c generic_stack.o
	$(CC) $(CFLAGS) 07_recursion_simulation.c generic_stack.o -o 07_recursion_simulation.exe

08_tower_of_hanoi.exe: 08_tower_of_hanoi.c generic_stack.o
	$(CC) $(CFLAGS) 08_tower_of_hanoi.c generic_stack.o -o 08_tower_of_hanoi.exe

# Run editor in automated demonstration mode
demo-editor: editor.exe
	@.\editor.exe --demo

# Launch editor interactively in terminal
run-editor: editor.exe
	@.\editor.exe

# Run all 8 examples in sequence
run: all
	@echo "--- 1. Sequence Reversal ---"
	@.\01_reverse_list.exe
	@echo "\n--- 2. Parentheses Checker ---"
	@.\02_parentheses_checker.exe
	@echo "\n--- 3. Infix to Postfix ---"
	@.\03_infix_to_postfix.exe
	@echo "\n--- 4. Postfix Evaluation ---"
	@.\04_eval_postfix.exe
	@echo "\n--- 5. Infix to Prefix ---"
	@.\05_infix_to_prefix.exe
	@echo "\n--- 6. Prefix Evaluation ---"
	@.\06_eval_prefix.exe
	@echo "\n--- 7. Recursion Simulation ---"
	@.\07_recursion_simulation.exe
	@echo "\n--- 8. Tower of Hanoi ---"
	@.\08_tower_of_hanoi.exe
	@echo "\n--- Case Study: Terminal Text Editor Demo ---"
	@.\editor.exe --demo

clean:
	rm -f *.exe *.o
