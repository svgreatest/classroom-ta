---
addons:
  - "@/../../slidev"
theme: default
background: '#181816'
title: "04: Shipping a Feature with GenericStack"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
---

<ShipFlow at="Ticket" />

<div class="gh-issue">
  <div class="gi-title">Add Back / Forward to the in-app browser <span class="gi-num">#142</span></div>
  <div class="gi-meta">
    <span class="gi-open">◉ Open</span>
    <span><strong>product-team</strong> opened this issue · 2 comments</span>
  </div>
  <div class="gi-body">
    <div class="gi-main">
      <div class="gi-comment-head"><strong>product-team</strong> commented</div>
      <div class="gi-comment">
        <p>As a shopper, I want <strong>Back</strong> and <strong>Forward</strong> buttons so I can return to products I just looked at.</p>
        <div class="gi-h">Acceptance criteria</div>
        <ul class="gi-tasks">
          <li><span class="gi-box"></span>Back returns to the previous page</li>
          <li><span class="gi-box"></span>Forward undoes a Back</li>
          <li><span class="gi-box"></span>Visiting a new page clears Forward</li>
          <li><span class="gi-box"></span>Buttons are disabled when there is nowhere to go</li>
        </ul>
      </div>
    </div>
    <div class="gi-side">
      <div class="gi-side-h">Assignees</div>
      <div class="gi-side-v">you</div>
      <div class="gi-side-h">Labels</div>
      <div><span class="gi-label gl-feat">feature</span> <span class="gi-label gl-web">browser</span></div>
      <div class="gi-side-h">Milestone</div>
      <div class="gi-side-v">Sprint 14</div>
    </div>
  </div>
</div>

<style>
.gh-issue { margin-top: 0.3rem; color: #e6edf3; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
.gi-title { font-size: 2rem; font-weight: 600; line-height: 1.2; color: #e6edf3; }
.gi-num { color: #7d8590; font-weight: 300; }
.gi-meta { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.6rem; padding-bottom: 0.8rem; border-bottom: 1px solid #30363d; font-size: 1rem; color: #7d8590; }
.gi-meta strong { color: #e6edf3; }
.gi-open { padding: 0.25rem 0.8rem; border-radius: 2rem; background: #238636; color: #fff; font-weight: 600; }
.gi-body { display: flex; gap: 1.5rem; margin-top: 0.9rem; }
.gi-main { flex: 1; border: 1px solid #30363d; border-radius: 0.4rem; overflow: hidden; }
.gi-comment-head { padding: 0.45rem 0.9rem; background: #161b22; border-bottom: 1px solid #30363d; font-size: 0.95rem; color: #7d8590; }
.gi-comment-head strong { color: #e6edf3; }
.gi-comment { padding: 0.8rem 1rem; background: #0d1117; }
.gi-comment p { margin: 0; font-size: 1.2rem; color: #e6edf3 !important; }
.gi-h { margin-top: 0.8rem; font-size: 1.15rem; font-weight: 600; padding-bottom: 0.2rem; border-bottom: 1px solid #30363d; }
.gi-tasks { list-style: none !important; margin: 0.5rem 0 0 0 !important; padding: 0 !important; }
.gi-tasks li { display: flex; align-items: center; gap: 0.6rem; font-size: 1.2rem; color: #e6edf3; line-height: 1.8; }
.gi-box { width: 1rem; height: 1rem; border: 1.5px solid #7d8590; border-radius: 0.2rem; flex-shrink: 0; }
.gi-side { width: 12rem; font-size: 0.95rem; }
.gi-side-h { color: #7d8590; font-weight: 600; margin: 0.5rem 0 0.25rem; padding-top: 0.5rem; border-top: 1px solid #30363d; }
.gi-side-h:first-child { border-top: none; padding-top: 0; margin-top: 0; }
.gi-side-v { color: #e6edf3; }
.gi-label { display: inline-block; padding: 0.05rem 0.55rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 600; }
.gl-feat { background: rgba(163, 113, 247, 0.2); color: #d2a8ff; border: 1px solid rgba(163, 113, 247, 0.5); }
.gl-web { background: rgba(56, 139, 253, 0.15); color: #79c0ff; border: 1px solid rgba(56, 139, 253, 0.5); }
</style>

<!--
This is what work looks like on a team: a ticket with a user story and acceptance criteria.
Today we take it from ticket to merged code. Every slide's top strip shows where we are.
-->

---

```yaml
clicks: 4
```

<ShipFlow at="Design" />

# Design: two stacks and a current page

<div class="flex items-center gap-10 text-2xl mb-3">
  <div><span class="text-[#9e978c]">action</span> <code>{{ ['open app', 'visit /shoes', 'visit /cart', 'Back', 'visit /sale'][$clicks] }}</code></div>
  <div><span class="text-[#9e978c]">on screen</span> <code>{{ ['/home', '/shoes', '/cart', '/shoes', '/sale'][$clicks] }}</code></div>
</div>

<div class="flex gap-16">
<StackViz title="back" :ops="['push /home', 'push /shoes', 'pop', 'push /shoes']" :step="$clicks" :capacity="3" slot-width="10rem" :show-meta="false" />
<StackViz title="forward" :ops="['noop', 'noop', 'push /cart', 'clear']" :step="$clicks" :capacity="3" slot-width="10rem" :show-meta="false" />
</div>

<!--
Whiteboard the design before writing code. Click through the ticket's own scenario.
Click 3 (Back): pop from back, push current onto forward. Click 4 (visit /sale): forward is cleared, which is AC #3.
-->

---

<ShipFlow at="Reuse" />

# We don't write a stack. We reuse one.

<div class="reuse">
  <div class="ru-box ru-ours">
    <div class="ru-file">browser_history.c</div>
    <div class="ru-sub">our feature · about 60 lines</div>
  </div>
  <div class="ru-arrow">
    <div><code>#include "generic_stack.h"</code></div>
    <div class="ru-line">──────────────▶</div>
    <div class="ru-sub">calls only the 6 public functions</div>
  </div>
  <div class="ru-box ru-lib">
    <div class="ru-file">generic_stack.h / .c</div>
    <div class="ru-sub">shared library from lesson 03</div>
    <div class="ru-sub">76 assertions already passing</div>
  </div>
</div>

<div class="grid grid-cols-3 gap-4 mt-8 text-lg">
<Card title="Already tested" type="tip">

We inherit 76 passing checks for free.

</Card>
<Card title="One place to fix" type="info">

A bug fixed in the library is fixed for every team using it.

</Card>
<Card title="In industry" type="default">

Internal libraries, npm / pip packages, Boost, the C standard library.

</Card>
</div>

<style>
.reuse { display: flex; align-items: center; gap: 1.2rem; margin-top: 1.5rem; }
.ru-box { padding: 1rem 1.2rem; border-radius: 0.75rem; border: 2px solid #383733; background: #22221f; min-width: 15rem; }
.ru-ours { border-color: #cc785c; }
.ru-lib { border-color: #10b981; }
.ru-file { font-family: var(--slidev-code-font, monospace); font-size: 1.3rem; color: #faf6ee; font-weight: 700; }
.ru-sub { font-size: 1rem; color: #9e978c; margin-top: 0.25rem; }
.ru-arrow { flex: 1; text-align: center; }
.ru-line { color: #5c5a54; font-size: 1.4rem; }
</style>

<!--
In VS Code: open code/Makefile and show LIB = ../../03-pointers-and-stacks/code.
We compile against the library where it lives. We do not copy it.
-->

---

<ShipFlow at="Code" />

# Our interface: `browser_history.h`

```c {all|1-4|6|8-12|all}
typedef struct {
    char url[64];        // stored BY VALUE: push copies the whole struct
    int  scroll_y;
} Page;

typedef struct History History;   // opaque: callers can't see the stacks

History    *history_create(const char *home_url);
void        history_visit(History *h, const char *url);
bool        history_back(History *h);      // false = button disabled
bool        history_forward(History *h);
const Page *history_current(const History *h);
```

<!--
Same idea as generic_stack.h: the rest of the app only reads this file.
Ask: why char url[64] and not char *url? (Hint: push copies bytes; a pointer could dangle.)
-->

---

<ShipFlow at="Code" />

# Two stacks from the same library

```c {1-5|8-9|10-14|all}
struct History {
    GenericStack *back;      // pages behind us
    GenericStack *forward;   // pages we came Back from
    Page current;            // on screen now
};
History *history_create(const char *home_url) {
    History *h = malloc(sizeof *h);
    h->back    = generic_stack_create(sizeof(Page), 8);
    h->forward = generic_stack_create(sizeof(Page), 8);
    if (!h->back || !h->forward) {          // undo on failure
        generic_stack_destroy(h->back);
        generic_stack_destroy(h->forward);
        free(h); return NULL;
    }
    h->current = make_page(home_url);
    return h;
}
```

---

<ShipFlow at="Code" />

# `history_visit`: push, show, clear Forward

```c {2|4|6-7|all}
void history_visit(History *h, const char *url) {
    generic_stack_push(h->back, &h->current);     // 1. leave: remember this page

    h->current = make_page(url);                   // 2. show the new page

    while (generic_stack_pop(h->forward, NULL)) {  // 3. AC #3: clear Forward
    }                                              //    (no clear() in the library:
}                                                  //     build it from pop)
```

<InIndustry where="Working with someone else's API" icon="🧩">
The library has no <code>clear()</code>. You compose what you need from the functions it does offer.
</InIndustry>

---

<ShipFlow at="Code" />

# `history_back`: pop from one, push onto the other

```c {3|5|7|all}
bool history_back(History *h) {
    Page prev;
    if (!generic_stack_pop(h->back, &prev)) return false;   // ① nothing behind: disabled

    generic_stack_push(h->forward, &h->current);            // ② here becomes Forward

    h->current = prev;                                      // ③ step back
    return true;
}
```

<div class="mt-6 text-2xl">

`history_forward` is the mirror image: the same three steps with the stacks swapped.

</div>

---

<ShipFlow at="Test" />

# The tests are the acceptance criteria

```c {all|3-4|5-6|all}
// AC #3: visiting a new page clears Forward.
static void test_new_visit_clears_forward(void) {
    History *h = history_create("/home");
    history_visit(h, "/shoes");
    history_back(h);               // Forward now holds /shoes
    history_visit(h, "/sale");     // ...a new visit must throw it away
    EXPECT(!history_forward(h));
    EXPECT_URL(h, "/sale");
    history_destroy(h);
}
```

```text
$ mingw32-make test
WEB-142: all acceptance tests passed
```

<!--
One test per acceptance criterion, plus one the reviewer would ask for: 100 visits, far past capacity 8, so the stacks must grow.
In industry these run on every pull request (CI).
-->

---

<ShipFlow at="Review" />

# Code review catches a bug

<div class="gh-pr">
  <div class="pr-check"><span class="pr-x">✗</span> <strong>ci / test</strong> — 2 checks failed: <code>expected /sale, got /shoes</code></div>
  <div class="pr-file">
    <div class="pr-file-head"><span class="pr-file-diff">+4 −0</span> browser_history.c</div>
    <div class="pr-hunk">@@ -55,0 +55,4 @@ void history_visit(History *h, const char *url)</div>
    <div class="pr-line add"><span class="ln">55</span><span class="mk">+</span>void history_visit(History *h, const char *url) {</div>
    <div class="pr-line add"><span class="ln">56</span><span class="mk">+</span>    generic_stack_push(h->back, &h->current);</div>
    <div class="pr-line add"><span class="ln">57</span><span class="mk">+</span>    h->current = make_page(url);</div>
    <div class="pr-review">
      <div class="rv-head"><span class="rv-avatar">SR</span><strong>senior-reviewer</strong> requested changes on line 57</div>
      <div class="rv-text">Back, then visit <code>/sale</code>, then Forward lands on <code>/shoes</code>. Issue #142 says a new visit clears Forward.</div>
      <div class="rv-suggest">
        <div class="rv-suggest-h">Suggested change</div>
        <div class="pr-line add"><span class="mk">+</span>    while (generic_stack_pop(h->forward, NULL)) { }</div>
      </div>
    </div>
    <div class="pr-line add"><span class="ln">58</span><span class="mk">+</span>}</div>
  </div>
</div>

<style>
.gh-pr { margin-top: 0.2rem; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #e6edf3; }
.pr-check { padding: 0.35rem 0.9rem; margin-bottom: 0.5rem; border: 1px solid #30363d; border-radius: 0.4rem; background: #161b22; font-size: 1rem; }
.pr-check code { font-size: 0.9rem; }
.pr-x { color: #f85149; font-weight: 700; margin-right: 0.3rem; }
.pr-file { border: 1px solid #30363d; border-radius: 0.4rem; overflow: hidden; background: #0d1117; }
.pr-file-head { padding: 0.4rem 0.9rem; background: #161b22; border-bottom: 1px solid #30363d; font-family: var(--slidev-code-font, monospace); font-size: 1rem; }
.pr-file-diff { color: #3fb950; margin-right: 0.6rem; }
.pr-hunk { padding: 0.2rem 0.9rem; background: rgba(56, 139, 253, 0.12); color: #7d8590; font-family: var(--slidev-code-font, monospace); font-size: 0.9rem; }
.pr-line { display: flex; font-family: var(--slidev-code-font, monospace); font-variant-ligatures: none; font-size: 1.1rem; line-height: 1.5; white-space: pre; }
.pr-line.add { background: rgba(46, 160, 67, 0.15); }
.pr-line .ln { width: 3rem; padding-right: 0.6rem; text-align: right; color: #7d8590; background: rgba(46, 160, 67, 0.1); }
.pr-line .mk { width: 1.4rem; text-align: center; color: #3fb950; }
.pr-review { margin: 0.35rem 0.8rem 0.35rem 3.5rem; border: 1px solid #30363d; border-radius: 0.4rem; background: #161b22; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
.rv-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; border-bottom: 1px solid #30363d; font-size: 0.95rem; color: #7d8590; }
.rv-head strong { color: #e6edf3; }
.rv-avatar { width: 1.6rem; height: 1.6rem; border-radius: 50%; background: #6e40c9; color: #fff; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.rv-text { padding: 0.35rem 0.8rem; font-size: 1.1rem; color: #e6edf3; }
.rv-suggest { margin: 0 0.8rem 0.5rem; border: 1px solid #30363d; border-radius: 0.3rem; overflow: hidden; }
.rv-suggest-h { padding: 0.2rem 0.6rem; background: #0d1117; border-bottom: 1px solid #30363d; font-size: 0.85rem; color: #7d8590; }
</style>

<!--
The first draft forgot AC #3. Two independent safety nets caught it: the CI test run (top) and a human reviewer (inline comment with a suggested change).
The failing output is real: `FAIL line 65: !history_forward(h)` / `FAIL line 66: expected /sale, got /shoes`.
-->

---

<ShipFlow at="Ship" />

# Ship it: `git push`

```text {1-3|4-5|6-12|all}
$ git commit -am "Clear Forward on new visit (review feedback)"
[web-142-back-forward 8d1e4f7] Clear Forward on new visit (review feedback)
 1 file changed, 6 insertions(+)
$ mingw32-make test
WEB-142: all acceptance tests passed
$ git push
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 412 bytes | 412.00 KiB/s, done.
To github.com:shop/storefront.git
   3f9c2ab..8d1e4f7  web-142-back-forward -> web-142-back-forward
```

<div class="mt-4 text-xl">✅ <code>ci / test</code> passed &nbsp;→&nbsp; ✅ review approved &nbsp;→&nbsp; merged &nbsp;→&nbsp; closes <strong>#142</strong></div>

<!--
Fix the review comment, re-run the tests locally, commit, push. The push re-runs CI on the pull request; once it's green and approved, the PR is merged and the issue closes.
Run `mingw32-make demo` in VS Code to show the finished feature.
-->

---

<MCQ
  label="Check · Back / Forward"
  context="Start on A. Visit B, visit C, Back, Back, then visit D."
  question="What is on the Forward stack now?"
  :options="['C, B', 'B', 'Nothing', 'D']"
  answer="C"
  :timer="60"
  timer-title="60 s"
>
  <template #explanation>
    <p>After the two Backs, Forward holds B and C.</p>
    <p>Visiting D starts a new branch, so <code>history_visit</code> clears Forward (AC #3).</p>
  </template>
</MCQ>

---

<BigIdea kicker="Takeaway">
Real software is mostly reusing tested pieces through their interfaces, then proving the result with tests and review.
</BigIdea>
