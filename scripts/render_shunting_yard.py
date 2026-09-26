import os
import sys

# Ensure FFmpeg is in PATH
ffmpeg_dir = r"C:\Users\dell\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin"
os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]

from manim import *

class ShuntingYardAnalogy(Scene):
    def construct(self):
        # Background color
        self.camera.background_color = "#141413"

        # Title and Subtitle
        title = Text("Dijkstra's Shunting-Yard Railroad Analogy", font_size=30, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text("Converting Infix (2 + 3 * 4) to Postfix (2 3 4 * +) using a Siding Track", font_size=18, color="#cc785c")
        subtitle.next_to(title, DOWN, buff=0.15)
        
        self.play(FadeIn(title), FadeIn(subtitle))

        # Main horizontal track (y = 0.6)
        # Left track is OUTPUT, Right track is INPUT
        main_track = Line(start=np.array([-6.3, 0.6, 0]), end=np.array([6.3, 0.6, 0]), color="#52504a", stroke_width=6)
        
        # Railroad ties for visual realism
        ties = VGroup()
        for x in np.arange(-6.2, 6.3, 0.4):
            ties.add(Line(start=[x, 0.42, 0], end=[x, 0.78, 0], color="#383734", stroke_width=3))
        
        # Dead-end siding track (Vertical down at x = 0)
        siding_left = Line(start=np.array([-0.7, 0.6, 0]), end=np.array([-0.7, -2.5, 0]), color="#52504a", stroke_width=5)
        siding_right = Line(start=np.array([0.7, 0.6, 0]), end=np.array([0.7, -2.5, 0]), color="#52504a", stroke_width=5)
        siding_ties = VGroup()
        for y in np.arange(-2.3, 0.5, 0.35):
            siding_ties.add(Line(start=[-0.85, y, 0], end=[0.85, y, 0], color="#383734", stroke_width=3))
            
        siding_bumper = Line(start=np.array([-1.0, -2.5, 0]), end=np.array([1.0, -2.5, 0]), color="#e11d48", stroke_width=8)
        bumper_label = Text("Bumper (Bottom of Stack)", font_size=12, color="#fb7185").next_to(siding_bumper, DOWN, buff=0.12)

        # Track Labels & Direction Arrows
        input_label = Text("INPUT TRACK (Infix: 2 + 3 * 4)", font_size=15, color="#f59e0b", weight=BOLD).move_to([3.5, 1.6, 0])
        input_arrow = Text("<<< Train moves West towards switch", font_size=13, color="#fbbf24").next_to(input_label, DOWN, buff=0.12)
        
        output_label = Text("OUTPUT TRACK (Postfix: 2 3 4 * +)", font_size=15, color="#10b981", weight=BOLD).move_to([-3.5, 1.6, 0])
        output_sub = Text("Assembles in Left-to-Right Postfix <<<", font_size=13, color="#34d399").next_to(output_label, DOWN, buff=0.12)
        
        siding_label = Text("Operator Siding\n(LIFO Stack)", font_size=14, color="#f59e0b", line_spacing=1.1).next_to(siding_right, RIGHT, buff=0.25).shift(UP * 0.2)

        yard_decorations = VGroup(ties, siding_ties, main_track, siding_left, siding_right, siding_bumper,
                                  bumper_label, input_label, input_arrow, output_label, output_sub, siding_label)

        self.play(Create(yard_decorations), run_time=1.5)

        # Status text for step explanations
        status_box = Rectangle(width=11.6, height=0.65, color="#383733", fill_color="#1c1b18", fill_opacity=0.92).to_edge(DOWN, buff=0.35)
        status_text = Text("Expression arriving: 2 + 3 * 4 (Reading Left-to-Right)", font_size=16, color=WHITE).move_to(status_box)
        self.play(FadeIn(status_box), FadeIn(status_text))

        # Helper to create train cars
        def make_car(label_char, is_operator=False):
            bg_color = "#d97706" if is_operator else "#0284c7"
            border_color = "#f59e0b" if is_operator else "#38bdf8"
            box = RoundedRectangle(corner_radius=0.12, width=1.05, height=0.65, color=border_color, fill_color=bg_color, fill_opacity=0.95)
            # Add wheels for a fun train feel
            w1 = Circle(radius=0.08, color="#78756d", fill_color="#292524", fill_opacity=1).move_to(box.get_corner(DL) + [0.2, -0.05, 0])
            w2 = Circle(radius=0.08, color="#78756d", fill_color="#292524", fill_opacity=1).move_to(box.get_corner(DR) + [-0.2, -0.05, 0])
            txt = Text(label_char, font_size=22, color=WHITE, weight=BOLD).move_to(box)
            return VGroup(box, w1, w2, txt)

        # Initial train on Input Track (Right Side)
        # Positioned so that reading Left to Right is: 2  +  3  *  4
        car2 = make_car("2").move_to([1.0, 0.6, 0])
        car_plus = make_car("+", is_operator=True).move_to([2.2, 0.6, 0])
        car3 = make_car("3").move_to([3.4, 0.6, 0])
        car_mult = make_car("*", is_operator=True).move_to([4.6, 0.6, 0])
        car4 = make_car("4").move_to([5.8, 0.6, 0])

        input_train = VGroup(car2, car_plus, car3, car_mult, car4)
        self.play(FadeIn(input_train, shift=LEFT * 0.5), run_time=1)
        self.wait(1)

        # -------------------------------------------------------------------------
        # STEP 1: Operand '2' rolls straight through junction to Output track
        # -------------------------------------------------------------------------
        new_status = Text("1. Car [ 2 ] (operand): rolls straight across junction to Output Track.", font_size=15, color="#38bdf8").move_to(status_box)
        self.play(Transform(status_text, new_status))
        self.play(
            car2.animate.move_to([-5.6, 0.6, 0]),
            car_plus.animate.move_to([1.0, 0.6, 0]),
            car3.animate.move_to([2.2, 0.6, 0]),
            car_mult.animate.move_to([3.4, 0.6, 0]),
            car4.animate.move_to([4.6, 0.6, 0]),
            run_time=1.5
        )
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 2: Operator '+' diverts down into Siding Track (Push)
        # -------------------------------------------------------------------------
        new_status = Text("2. Car [ + ] (operator): diverts into Siding Track (Push onto LIFO Stack).", font_size=15, color="#f59e0b").move_to(status_box)
        self.play(Transform(status_text, new_status))
        # Move to junction
        self.play(
            car_plus.animate.move_to([0, 0.6, 0]),
            car3.animate.move_to([1.0, 0.6, 0]),
            car_mult.animate.move_to([2.2, 0.6, 0]),
            car4.animate.move_to([3.4, 0.6, 0]),
            run_time=0.8
        )
        # Divert down to bottom of siding
        self.play(car_plus.animate.move_to([0, -2.0, 0]), run_time=1)
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 3: Operand '3' rolls straight through, couples behind '2'
        # -------------------------------------------------------------------------
        new_status = Text("3. Car [ 3 ] (operand): rolls straight through and couples behind [ 2 ].", font_size=15, color="#38bdf8").move_to(status_box)
        self.play(Transform(status_text, new_status))
        self.play(
            car3.animate.move_to([-4.4, 0.6, 0]),
            car_mult.animate.move_to([1.0, 0.6, 0]),
            car4.animate.move_to([2.2, 0.6, 0]),
            run_time=1.5
        )
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 4: Operator '*' arrives. Precedence test: prec(*) > prec(+), push on top
        # -------------------------------------------------------------------------
        new_status = Text("4. Car [ * ] (operator): Precedence(*) > Precedence(+), so [ * ] parks on top of [ + ].", font_size=15, color="#f59e0b").move_to(status_box)
        self.play(Transform(status_text, new_status))
        self.play(
            car_mult.animate.move_to([0, 0.6, 0]),
            car4.animate.move_to([1.0, 0.6, 0]),
            run_time=0.8
        )
        self.play(car_mult.animate.move_to([0, -1.2, 0]), run_time=1)
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 5: Operand '4' rolls straight through, couples behind '3'
        # -------------------------------------------------------------------------
        new_status = Text("5. Car [ 4 ] (operand): rolls straight through and couples behind [ 3 ].", font_size=15, color="#38bdf8").move_to(status_box)
        self.play(Transform(status_text, new_status))
        self.play(
            car4.animate.move_to([-3.2, 0.6, 0]),
            run_time=1.5
        )
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 6: End of Input -> Drain Siding Track in LIFO order
        # Pop '*' first
        # -------------------------------------------------------------------------
        new_status = Text("6. End of Input: Siding cars back out in LIFO order. Top car [ * ] reverses out first.", font_size=15, color="#34d399").move_to(status_box)
        self.play(Transform(status_text, new_status))
        
        # Pull up to junction
        self.play(car_mult.animate.move_to([0, 0.6, 0]), run_time=0.8)
        # Roll onto output track behind '4'
        self.play(car_mult.animate.move_to([-2.0, 0.6, 0]), run_time=1.2)
        self.wait(0.7)

        # -------------------------------------------------------------------------
        # STEP 7: Pop '+' next
        # -------------------------------------------------------------------------
        new_status = Text("7. Next car [ + ] reverses out of siding and couples behind [ * ].", font_size=15, color="#34d399").move_to(status_box)
        self.play(Transform(status_text, new_status))
        
        # Pull up to junction
        self.play(car_plus.animate.move_to([0, 0.6, 0]), run_time=0.8)
        # Roll onto output track behind '*'
        self.play(car_plus.animate.move_to([-0.8, 0.6, 0]), run_time=1.2)
        self.wait(1)

        # -------------------------------------------------------------------------
        # FINAL SUMMARY BANNER
        # -------------------------------------------------------------------------
        final_banner = Rectangle(width=11.6, height=1.35, color="#10b981", fill_color="#064e3b", fill_opacity=0.95).move_to([0, -1.5, 0])
        final_text1 = Text("Final Postfix Output (Left-to-Right):   2   3   4   *   +", font_size=22, color=WHITE, weight=BOLD).next_to(final_banner.get_top(), DOWN, buff=0.25)
        final_text2 = Text("Notice: Operands kept order (2, 3, 4). Operators placed by precedence (* then +). Zero parentheses needed!", font_size=13.5, color="#a7f3d0").next_to(final_text1, DOWN, buff=0.15)
        final_group = VGroup(final_banner, final_text1, final_text2)

        self.play(FadeOut(status_box), FadeOut(status_text), FadeIn(final_group, shift=UP * 0.3))
        self.wait(3)
