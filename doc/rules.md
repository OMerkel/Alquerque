# Rules of Alquerque

How to play Alquerque so that two people can sit down at a table and
play the game with a drawn board and 24 pieces in total.

## Game Material

![Empty game board with algebraic point annotation](../html5/src/img/algebraic_notation.jpg)

* One board with **25 points** arranged as a square of 5 columns and 5 rows.
  The points are the intersections of the drawn lines — pieces stand **on the
  points**, not inside the squares.
* The lines connect the points like this:
  * every point is connected to its direct neighbour to the left, right,
    above and below,
  * in addition, diagonal lines are drawn so that a diagonal exists on every
    second point. The four corner points and the centre have diagonals; the
    points in between do not.
* **12 light pieces** for one player and **12 dark pieces** for the other.
  Simple draughts/checkers pieces or two colours of pebbles work fine.

For talking about positions, name the columns `a` to `e` from left to right
and the rows `1` to `5` from bottom to top. Row 1 is the **home row** of Light,
row 5 is the **home row** of Dark.

```text
 5  b-b-b-b-b        b = dark piece
    |\|/|\|/|        w = light piece
 4  b-b-b-b-b        + = empty point
    |/|\|/|\|
 3  b-b-+-w-w
    |\|/|\|/|
 2  w-w-w-w-w
    |/|\|/|\|
 1  w-w-w-w-w
    a b c d e
```

## Setup

![Initial setup](../html5/src/img/initial_board.jpg)

* Light fills rows 1 and 2 completely, plus the points `d3` and `e3`.
* Dark fills rows 5 and 4 completely, plus the points `a3` and `b3`.
* The centre point `c3` stays empty. It is the only free point at the start.

## Objective of the Game

Take all of your opponent's pieces off the board — or leave your opponent in a
position where they cannot make any legal move on their turn. In both cases you
win immediately. With these rules a draw is not possible.

## Rules to Move Pawns

Light moves first, then the players alternate. **You must move on your turn —
passing is not allowed.**

On your turn:

1. **If you can capture, you must capture.** Check this first.
2. Only if no capture is available anywhere, you make a normal move.

A normal move means: take one of your own pieces and slide it **along a drawn
line onto the neighbouring point**, which must be empty. One step only.
Diagonal steps are only possible where a diagonal line is actually drawn.

Two restrictions apply to normal moves (but not to captures):

* **No moving backwards.** Light may never move to a lower-numbered row, Dark
  may never move to a higher-numbered row. Sideways and forwards is fine.
* **No taking back your last step.** A piece may not step straight back onto
  the point it came from with its own previous normal move. Pick a different
  step or a different piece.

A piece that has arrived on the opponent's home row (Light on row 5, Dark on
row 1) is stuck there for normal moves — it cannot be moved any more. It may
still capture, and once a capture has carried it off that row it can move
normally again.

Pieces never stack. Only one piece per point.

## Capturing

Capturing works like in draughts, by **jumping**:

* Your piece stands next to an opponent's piece along a drawn line, and the
  next point behind that opponent's piece **on the same straight line** is
  empty.
* Then you lift your piece over the opponent's piece and put it down on that
  empty point. The jumped piece is **removed from the board at once** and never
  comes back.
* Exactly one piece is jumped per jump. You may never jump over your own pieces
  and never over two pieces at the same time.
* Jumps may go in **any direction along the lines — including backwards** toward
  your own home row. The no-backwards rule applies to normal moves only.

**Captures are compulsory.** If any capture is available at the start of your
turn, you must play a capture instead of a normal move.

**Multiple jumps:** after a jump, if the very same piece can jump again, it
must do so, and it keeps jumping until no further jump with that piece is
possible. All of that is one single turn. Between jumps the direction may
change. You cannot jump straight back the way you came, because the point you
just jumped over is now empty.

You do **not** have to choose the longest capture sequence. If several captures
or several continuations are available, you may freely pick any of them.

## Sample Game

Starting position, Light to move. The only empty point is `c3`.

1. **Light `c2–c3`.** Light steps its piece forward into the free centre point.
   The point `c2` is now empty.
2. **Dark must capture `c4 x c3 – c2`.** Dark's piece on `c4` is adjacent to
   Light's new piece on `c3` along the vertical line, and `c2` behind it is
   empty. The Light piece is removed, Dark now stands deep inside Light's camp.
   Score: Light 11, Dark 12.
3. **Light must capture in return, e.g. `c1 x c2 – c3`.** The Dark piece on `c2`
   is removed and Light occupies the centre again.
   Score: Light 11, Dark 11.

The game continues in this style. Material usually stays balanced for a while,
until one player runs out of safe moves and is forced to offer a piece. Keep the
compulsory-capture rule in mind: a well-placed sacrifice can drag your opponent's
piece into a position where you answer with a long multiple capture.
