# Sudoku

Sudoku grids generated on the fly, always with a single solution, in five levels. Pencil notes, undo, hints, mistakes shown or hidden, and the game in progress kept from one session to the next.

*Version française : [README.md](README.md)*

## The goal

Fill the 9 × 9 grid so that every row, every column and every 3 × 3 box contains the digits 1 to 9 once each.

## Levels

| Level | Digits given at the start |
|---|---|
| Easy | 40 |
| Medium | 32 |
| Hard | 27 |
| Expert | 23 |
| Diabolical | 21 |

Each grid is created when you ask for it, and the plugin checks that it has only one solution.

## Playing

- Click a cell, then a digit on the pad (or on the keyboard). Under each digit on the pad, how many are still to place; ✓ when they are all in.
- The row, column and box of the selected cell are highlighted, as well as the cells holding the same digit.
- Typing the same digit again removes it.
- **Notes**: in notes mode, digits are written small as candidates. A correct digit you place is removed automatically from the notes of its row, column and box.
- **Erase** clears the cell, **Undo** goes back (up to 300 moves).
- **Hint** fills the selected cell with the right digit (or a random cell if it is already right).
- **Show mistakes** colours wrong digits red.

## Keyboard

- **1 to 9**: fill; **Shift + digit** (or **N** to toggle notes mode): note.
- **Arrow keys**: move between cells.
- **Backspace** or **Delete**: erase.
- **Ctrl + Z**: undo.

## Time and records

The timer runs while the plugin is on screen. The top shows the number of mistakes, hints used and the best time for the level. Finishing a grid faster than your record sets a new record; finished grids are counted per level.

## Data and sync

Best times, finished grids and the game in progress are stored by NeoDex, backed up and synced between your PCs when sync is on. On first launch, the plugin picks up what you already had in NeoDex.

## Install

In NeoDex: **NeoStore → Discover → Sudoku → Install**.

Building a plugin: see the [NeoDex SDK](https://github.com/NDesumeur/neodex-sdk).
