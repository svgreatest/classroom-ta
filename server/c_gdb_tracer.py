"""
c_gdb_tracer.py - Native Windows C execution tracer for OnlinePythonTutor using GDB + Python.
Compiles C code with GCC and traces stack frames, local variables, pointers, structs,
arrays, heap allocations, and stdout, converting execution into the OnlinePythonTutor JSON trace format.
"""

import json
import os
import re
import subprocess
import sys
import tempfile

MAX_STEPS = 400

HEAP_TRACKER_HEADER = """
#include <stddef.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    void *addr;
    size_t size;
    int active;
} __OptHeapBlock;

__OptHeapBlock __opt_heap_blocks[128];
int __opt_heap_count = 0;

__attribute__((constructor)) static void __opt_init_io(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
}

static inline void* __opt_track_malloc(size_t sz) {
    void *p = malloc(sz);
    if (p && __opt_heap_count < 128) {
        __opt_heap_blocks[__opt_heap_count].addr = p;
        __opt_heap_blocks[__opt_heap_count].size = sz;
        __opt_heap_blocks[__opt_heap_count].active = 1;
        __opt_heap_count++;
    }
    return p;
}

static inline void __opt_track_free(void *p) {
    if (p) {
        for (int i = 0; i < __opt_heap_count; i++) {
            if (__opt_heap_blocks[i].addr == p) {
                __opt_heap_blocks[i].active = 0;
            }
        }
    }
    free(p);
}

static inline void* __opt_track_calloc(size_t n, size_t sz) {
    void *p = __opt_track_malloc(n * sz);
    if (p) memset(p, 0, n * sz);
    return p;
}

// realloc may move the block: retire the old one and record the new one,
// otherwise the visualizer keeps drawing the freed block and loses the new one.
static inline void* __opt_track_realloc(void *old, size_t sz) {
    void *p = realloc(old, sz);
    if (!p) return NULL;
    for (int i = 0; i < __opt_heap_count; i++) {
        if (__opt_heap_blocks[i].active && __opt_heap_blocks[i].addr == old) {
            __opt_heap_blocks[i].active = 0;
        }
    }
    if (__opt_heap_count < 128) {
        __opt_heap_blocks[__opt_heap_count].addr = p;
        __opt_heap_blocks[__opt_heap_count].size = sz;
        __opt_heap_blocks[__opt_heap_count].active = 1;
        __opt_heap_count++;
    }
    return p;
}

#define malloc(sz) __opt_track_malloc(sz)
#define calloc(n, sz) __opt_track_calloc(n, sz)
#define realloc(p, sz) __opt_track_realloc(p, sz)
#define free(p)    __opt_track_free(p)
#line 1 "usercode.c"
"""


def compile_and_trace(c_source_code: str, timeout_sec: float = 8.0) -> dict:
    """
    Takes C source code string, compiles it with GCC, runs GDB tracer,
    and returns a dict matching the OnlinePythonTutor trace format:
    { "code": c_source_code, "trace": [ ... ] }
    """
    temp_dir = tempfile.mkdtemp(prefix="opt_c_")
    src_file = os.path.join(temp_dir, "usercode.c")
    exe_file = os.path.join(temp_dir, "usercode.exe")
    gdb_script_file = os.path.join(temp_dir, "tracer.py")
    trace_output_file = os.path.join(temp_dir, "trace.json")

    try:
        # Prepend heap tracker header with #line 1 so line numbers remain exact
        full_source = HEAP_TRACKER_HEADER + c_source_code
        with open(src_file, "w", encoding="utf-8") as f:
            f.write(full_source)

        # 1. Compile with GCC
        compile_cmd = [
            "gcc",
            "-std=c11",
            "-g3",
            "-O0",
            "-fno-omit-frame-pointer",
            src_file,
            "-o",
            exe_file,
        ]
        compile_proc = subprocess.run(
            compile_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
        )

        if compile_proc.returncode != 0:
            err_msg = compile_proc.stderr or compile_proc.stdout or "Compilation error"
            err_line = 1
            match = re.search(r"usercode\.c:(\d+):", err_msg)
            if match:
                err_line = int(match.group(1))

            return {
                "code": c_source_code,
                "trace": [
                    {
                        "event": "uncaught_exception",
                        "exception_msg": f"GCC Compilation Error:\n{err_msg}",
                        "line": err_line,
                    }
                ],
            }

        # 2. Write the GDB Python script
        trace_output_escaped = trace_output_file.replace("\\", "\\\\")
        src_file_escaped = src_file.replace("\\", "\\\\")
        stdout_file = os.path.join(temp_dir, "stdout.txt")
        stdout_file_escaped = stdout_file.replace("\\", "\\\\")

        with open(stdout_file, "w", encoding="utf-8") as sf:
            pass

        gdb_script_content = f"""
import gdb
import json
import os
import sys

OUTPUT_FILE = "{trace_output_escaped}"
SOURCE_FILE = "{src_file_escaped}"
STDOUT_FILE = "{stdout_file_escaped}"
MAX_STEPS = {MAX_STEPS}

gdb.execute("set pagination off")
gdb.execute("set confirm off")
gdb.execute("break main")

try:
    gdb.execute('run > "{stdout_file_escaped}"')
except Exception as e:
    pass

trace = []
step_count = 0

def format_hex_addr(addr):
    if addr is None:
        return "0x0"
    if isinstance(addr, int):
        return f"0x{{addr:X}}"
    try:
        val = int(addr)
        return f"0x{{val:X}}"
    except:
        return str(addr)

def encode_value(val, heap_dict, depth=0):
    if depth > 8:
        return ["C_DATA", "0x0", "error", "..."]
    
    try:
        t = val.type.strip_typedefs()
    except:
        return ["C_DATA", "0x0", "unknown", str(val)]
    
    code = t.code
    addr = "0x0"
    try:
        if val.address:
            addr = format_hex_addr(int(val.address))
    except:
        pass

    # TYPE_CODE_PTR = 1
    if code == gdb.TYPE_CODE_PTR:
        target_addr_int = 0
        try:
            target_addr_int = int(val)
        except:
            pass
        
        target_addr_hex = format_hex_addr(target_addr_int)
        return ["C_DATA", addr, "pointer", target_addr_hex]

    # TYPE_CODE_ARRAY = 2
    elif code == gdb.TYPE_CODE_ARRAY:
        elems = ["C_ARRAY", addr]
        try:
            low, high = t.range()
            count = high - low + 1
            count = min(count, 32)
            for i in range(count):
                elem_val = val[i]
                elems.append(encode_value(elem_val, heap_dict, depth + 1))
        except Exception as e:
            elems.append(["C_DATA", addr, "error", str(e)])
        return elems

    # TYPE_CODE_STRUCT = 3
    elif code == gdb.TYPE_CODE_STRUCT:
        return encode_struct(val, addr, heap_dict, depth + 1)

    # Primitive types
    else:
        type_str = str(t)
        v_str = str(val)
        try:
            if code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_BOOL):
                parsed_val = int(val)
            elif code == gdb.TYPE_CODE_FLT:
                parsed_val = float(val)
            else:
                parsed_val = v_str
        except:
            parsed_val = v_str

        return ["C_DATA", addr, type_str, parsed_val]

def encode_struct(val, addr, heap_dict, depth):
    t = val.type.strip_typedefs()
    struct_name = t.tag or str(t)
    ret = ["C_STRUCT", addr, struct_name]
    try:
        fields = t.fields()
        for f in fields:
            f_name = f.name
            if not f_name:
                continue
            try:
                f_val = val[f_name]
                encoded_f = encode_value(f_val, heap_dict, depth + 1)
            except Exception as e:
                encoded_f = ["C_DATA", "0x0", "error", str(e)]
            ret.append([f_name, encoded_f])
    except:
        pass
    return ret

# Step through execution
while step_count < MAX_STEPS:
    step_count += 1
    
    try:
        curr_frame = gdb.selected_frame()
    except:
        break

    sal = curr_frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    func_name = curr_frame.name()

    # Filter only lines within user code (and not internal tracer helpers)
    is_user_code = False
    if func_name and not func_name.startswith("__opt_") and not func_name.startswith("__"):
        if symtab and symtab.filename:
            base_fn = os.path.basename(symtab.filename)
            if base_fn in ("usercode.c", os.path.basename(SOURCE_FILE)):
                is_user_code = True

    if is_user_code and func_name is not None and line > 0:
        heap_dict = {{}}
        stack_entries = []
        pointer_targets = {{}}
        
        # Collect frames from outermost to innermost
        frames = []
        f = curr_frame
        while f:
            if f.name() is not None and not f.name().startswith("__opt_") and not f.name().startswith("__"):
                f_sal = f.find_sal()
                if f_sal.symtab and "usercode.c" in f_sal.symtab.filename:
                    frames.append(f)
            try:
                f = f.older()
            except:
                break
        
        frames.reverse() # Stack grows downward (main first)
        
        for f_item in frames:
            f_sal = f_item.find_sal()
            f_func = f_item.name()
            f_line = f_sal.line
            
            try:
                fp_hex = format_hex_addr(int(f_item.read_register("sp")))
            except:
                fp_hex = f"0x{{id(f_item):X}}"
                
            ordered_varnames = []
            encoded_locals = {{}}
            
            # Read variables
            try:
                block = f_item.block()
                while block and not block.is_static:
                    for sym in block:
                        if (sym.is_variable or sym.is_argument) and sym.name not in encoded_locals:
                            var_name = sym.name
                            ordered_varnames.append(var_name)
                            try:
                                val = f_item.read_var(sym)
                                vt = val.type.strip_typedefs()
                                if vt.code == gdb.TYPE_CODE_PTR:
                                    target_int = int(val)
                                    if target_int != 0:
                                        tgt = vt.target().strip_typedefs()
                                        if tgt.code != gdb.TYPE_CODE_VOID:
                                            pointer_targets[target_int] = tgt
                                encoded_locals[var_name] = encode_value(val, heap_dict)
                            except Exception as e:
                                encoded_locals[var_name] = ["C_DATA", "0x0", str(sym.type), "<optimized out>"]
                    block = block.superblock
            except:
                pass
            
            stack_entries.append({{
                "func_name": f_func,
                "frame_id": fp_hex,
                "unique_hash": f"{{f_func}}_{{fp_hex}}",
                "is_highlighted": (f_item == curr_frame),
                "is_parent": False,
                "is_zombie": False,
                "line": f_line,
                "ordered_varnames": ordered_varnames,
                "parent_frame_id_list": [],
                "encoded_locals": encoded_locals
            }})

        # Populate heap from active __opt_heap_blocks
        try:
            h_count = int(gdb.parse_and_eval("__opt_heap_count"))
            h_blocks = gdb.parse_and_eval("__opt_heap_blocks")
            for i in range(min(h_count, 64)):
                b = h_blocks[i]
                if int(b['active']) == 1:
                    b_addr = int(b['addr'])
                    b_size = int(b['size'])
                    b_hex = format_hex_addr(b_addr)
                    
                    target_type = pointer_targets.get(b_addr, None)
                    if target_type is None:
                        # Check if any pointer points into this range
                        for p_addr, p_type in pointer_targets.items():
                            if b_addr <= p_addr < b_addr + b_size:
                                target_type = p_type
                                break
                    if target_type is None:
                        target_type = gdb.lookup_type('int')
                    
                    type_sz = max(1, target_type.sizeof)
                    count = max(1, b_size // type_sz)
                    
                    if target_type.code == gdb.TYPE_CODE_STRUCT:
                        try:
                            eval_str = "*(" + str(target_type) + "*)(" + str(b_addr) + ")"
                            s_val = gdb.parse_and_eval(eval_str)
                            heap_dict[b_hex] = encode_struct(s_val, b_hex, heap_dict, depth=1)
                        except Exception as e:
                            heap_dict[b_hex] = ["C_STRUCT", b_hex, str(target_type)]
                    else:
                        elems = ["C_ARRAY", b_hex]
                        for idx in range(min(count, 32)):
                            elem_addr = b_addr + idx * type_sz
                            elem_hex = format_hex_addr(elem_addr)
                            try:
                                eval_str = "*(" + str(target_type) + "*)(" + str(elem_addr) + ")"
                                ev = gdb.parse_and_eval(eval_str)
                                elems.append(encode_value(ev, heap_dict, depth=1))
                            except Exception:
                                elems.append(["C_DATA", elem_hex, str(target_type), 0])
                        heap_dict[b_hex] = elems
        except Exception as e:
            pass

        cur_stdout = ""
        try:
            if os.path.exists(STDOUT_FILE):
                with open(STDOUT_FILE, "r", encoding="utf-8", errors="replace") as sf:
                    cur_stdout = sf.read()
        except:
            pass

        step_entry = {{
            "event": "step_line",
            "func_name": func_name,
            "line": line,
            "ordered_globals": [],
            "globals": {{}},
            "stack_to_render": stack_entries,
            "heap": heap_dict,
            "stdout": cur_stdout
        }}
        trace.append(step_entry)

    # Execute single step
    try:
        res = gdb.execute("step", to_string=True)
        if "exited" in res or "Inferior" in res or "Program terminated" in res:
            break
        if not gdb.inferiors()[0].is_valid():
            break
    except Exception as e:
        break

with open(OUTPUT_FILE, "w", encoding="utf-8") as out_f:
    json.dump({{"code": "", "trace": trace}}, out_f)

gdb.execute("quit")
"""
        with open(gdb_script_file, "w", encoding="utf-8") as f:
            f.write(gdb_script_content)

        # 3. Run GDB in batch mode
        gdb_cmd = ["gdb", "--batch", "-x", gdb_script_file, exe_file]
        gdb_proc = subprocess.run(
            gdb_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_sec,
        )

        if os.path.exists(trace_output_file):
            with open(trace_output_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["code"] = c_source_code
                if not data.get("trace"):
                    data["trace"] = [
                        {
                            "event": "instruction_limit_reached",
                            "exception_msg": "Program finished with 0 steps recorded.",
                            "line": 1,
                        }
                    ]
                return data
        else:
            return {
                "code": c_source_code,
                "trace": [
                    {
                        "event": "uncaught_exception",
                        "exception_msg": f"GDB Execution Error:\n{gdb_proc.stderr or gdb_proc.stdout}",
                        "line": 1,
                    }
                ],
            }

    except subprocess.TimeoutExpired:
        return {
            "code": c_source_code,
            "trace": [
                {
                    "event": "uncaught_exception",
                    "exception_msg": "Timeout: Execution exceeded allowed time (possible infinite loop).",
                    "line": 1,
                }
            ],
        }
    except Exception as e:
        return {
            "code": c_source_code,
            "trace": [
                {
                    "event": "uncaught_exception",
                    "exception_msg": f"Internal Tracer Exception: {str(e)}",
                    "line": 1,
                }
            ],
        }
    finally:
        try:
            for fname in os.listdir(temp_dir):
                os.remove(os.path.join(temp_dir, fname))
            os.rmdir(temp_dir)
        except:
            pass


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            code = f.read()
    else:
        code = """#include <stdio.h>
#include <stdlib.h>
int main() {
    int *buf = (int*)malloc(3 * sizeof(int));
    buf[0] = 10;
    buf[1] = 20;
    buf[2] = 30;
    free(buf);
    buf = NULL;
    return 0;
}
"""
    result = compile_and_trace(code)
    print(json.dumps(result, indent=2))
