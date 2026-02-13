import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Play,
  Heart,
} from "lucide-react";
import herImage from "figma:asset/508e99da14dc20889f2145d7a1a14cde5e05b979.png";
import himImage from "figma:asset/774abd4cbc561d78ec5a8cdd89fab5fc1047249e.png";

type CellType = "her" | "him" | null;

interface Constraint {
  type: "=" | "x";
  cell1: { row: number; col: number };
  cell2: { row: number; col: number };
  direction: "horizontal" | "vertical";
}

const GRID_SIZE = 8;

// Solution as provided
const SOLUTION: CellType[][] = [
  ["him", "him", "her", "her", "him", "him", "her", "her"],
  ["her", "her", "him", "him", "her", "her", "him", "him"],
  ["him", "her", "him", "her", "her", "him", "her", "him"],
  ["her", "him", "her", "him", "him", "her", "him", "her"],
  ["him", "him", "her", "her", "him", "him", "her", "her"],
  ["her", "her", "him", "him", "her", "her", "him", "him"],
  ["him", "her", "him", "her", "her", "him", "her", "him"],
  ["her", "him", "her", "him", "him", "her", "him", "her"],
];

// Starting position with pre-filled cells based on ASCII
const STARTING_GRID: CellType[][] = [
  [null, null, "her", null, null, "him", null, null], // Row 0: - = - R - - B - = -
  [null, "her", null, "him", "her", null, "him", null], // Row 1: - R - B R - B -
  ["him", null, null, null, null, null, null, "him"], // Row 2: B - - - = - - - B
  ["her", null, null, null, null, null, null, "her"], // Row 3: R - - - = - - - R
  ["him", null, null, null, null, null, null, "her"], // Row 4: B - - - x - - - R
  [null, "her", null, null, null, null, "him", null], // Row 5: - R - - - - B -
  [null, null, "him", null, null, "him", null, null], // Row 6: - - B - - B - -
  [null, null, null, "him", "him", null, null, null], // Row 7: - x - - B B - - x -
];

// Constraints based on ASCII (= and x between cells)
const CONSTRAINTS: Constraint[] = [
  // Row 0: - = - R - - B - = -
  {
    type: "=",
    cell1: { row: 0, col: 0 },
    cell2: { row: 0, col: 1 },
    direction: "horizontal",
  },
  {
    type: "=",
    cell1: { row: 0, col: 6 },
    cell2: { row: 0, col: 7 },
    direction: "horizontal",
  },

  // Row 2: B x - - - = - - - x B
  {
    type: "x",
    cell1: { row: 2, col: 0 },
    cell2: { row: 2, col: 1 },
    direction: "horizontal",
  },
  {
    type: "=",
    cell1: { row: 2, col: 3 },
    cell2: { row: 2, col: 4 },
    direction: "horizontal",
  },
  {
    type: "x",
    cell1: { row: 2, col: 6 },
    cell2: { row: 2, col: 7 },
    direction: "horizontal",
  },

  // Row 3: R x - - - = - - - x R
  {
    type: "x",
    cell1: { row: 3, col: 0 },
    cell2: { row: 3, col: 1 },
    direction: "horizontal",
  },
  {
    type: "=",
    cell1: { row: 3, col: 3 },
    cell2: { row: 3, col: 4 },
    direction: "horizontal",
  },
  {
    type: "x",
    cell1: { row: 3, col: 6 },
    cell2: { row: 3, col: 7 },
    direction: "horizontal",
  },

  // Row 4: B = - - - x - - - = R
  {
    type: "=",
    cell1: { row: 4, col: 0 },
    cell2: { row: 4, col: 1 },
    direction: "horizontal",
  },
  {
    type: "x",
    cell1: { row: 4, col: 3 },
    cell2: { row: 4, col: 4 },
    direction: "horizontal",
  },
  {
    type: "=",
    cell1: { row: 4, col: 6 },
    cell2: { row: 4, col: 7 },
    direction: "horizontal",
  },

  // Row 7: - x - - B B - - x -
  {
    type: "x",
    cell1: { row: 7, col: 0 },
    cell2: { row: 7, col: 1 },
    direction: "horizontal",
  },
  {
    type: "x",
    cell1: { row: 7, col: 6 },
    cell2: { row: 7, col: 7 },
    direction: "horizontal",
  },

  // Column 4
  {
    type: "x",
    cell1: { row: 1, col: 3 },
    cell2: { row: 2, col: 3 },
    direction: "vertical",
  },
  {
    type: "x",
    cell1: { row: 3, col: 4 },
    cell2: { row: 4, col: 4 },
    direction: "vertical",
  },
  {
    type: "=",
    cell1: { row: 5, col: 7 },
    cell2: { row: 6, col: 7 },
    direction: "vertical",
  },
];

export function Tango() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState<CellType[][]>(
    STARTING_GRID.map((row) => [...row]),
  );
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [lockedCells, setLockedCells] = useState<Set<string>>(
    new Set(),
  );

  // Load best time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tango-best-time");
    if (saved) {
      setBestTime(parseInt(saved, 10));
    }
  }, []);

  // Timer
  useEffect(() => {
    if (gameStarted && !gameWon) {
      const interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameWon]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setGameStarted(true);
    setTimer(0);
  };

  const handlePlayAgain = () => {
    setGrid(STARTING_GRID.map((row) => [...row]));
    setGameWon(false);
    setGameStarted(false);
    setTimer(0);
    setErrors(new Set());
  };

  useEffect(() => {
    // Mark starting cells as locked
    const locked = new Set<string>();
    STARTING_GRID.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null) {
          locked.add(`${r}-${c}`);
        }
      });
    });
    setLockedCells(locked);
  }, []);

  const toggleCell = (row: number, col: number) => {
    if (gameWon || lockedCells.has(`${row}-${col}`)) return;

    const newGrid = grid.map((r) => [...r]);
    if (newGrid[row][col] === null) {
      newGrid[row][col] = "her";
    } else if (newGrid[row][col] === "her") {
      newGrid[row][col] = "him";
    } else {
      newGrid[row][col] = null;
    }

    setGrid(newGrid);
    validateGrid(newGrid);
  };

  const validateGrid = (currentGrid: CellType[][]) => {
    const newErrors = new Set<string>();

    // Check if grid is completely filled
    const isFilled = currentGrid.every((row) =>
      row.every((cell) => cell !== null),
    );

    if (!isFilled) {
      setErrors(newErrors);
      return;
    }

    // Check constraint violations
    CONSTRAINTS.forEach((constraint, idx) => {
      const { cell1, cell2, type } = constraint;
      const val1 = currentGrid[cell1.row][cell1.col];
      const val2 = currentGrid[cell2.row][cell2.col];

      if (val1 && val2) {
        if (type === "=" && val1 !== val2) {
          newErrors.add(`constraint-${idx}`);
        } else if (type === "x" && val1 === val2) {
          newErrors.add(`constraint-${idx}`);
        }
      }
    });

    // Check row counts (4 each for 8x8 grid)
    currentGrid.forEach((row, rowIdx) => {
      const herCount = row.filter((c) => c === "her").length;
      const himCount = row.filter((c) => c === "him").length;
      if (herCount !== 4 || himCount !== 4) {
        newErrors.add(`row-${rowIdx}`);
      }
    });

    // Check column counts
    for (let col = 0; col < GRID_SIZE; col++) {
      const colValues = currentGrid.map((row) => row[col]);
      const herCount = colValues.filter(
        (c) => c === "her",
      ).length;
      const himCount = colValues.filter(
        (c) => c === "him",
      ).length;
      if (herCount !== 4 || himCount !== 4) {
        newErrors.add(`col-${col}`);
      }
    }

    // Check max 2 adjacent horizontally
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        if (
          currentGrid[row][col] &&
          currentGrid[row][col] === currentGrid[row][col + 1] &&
          currentGrid[row][col] === currentGrid[row][col + 2]
        ) {
          newErrors.add(`adj-h-${row}-${col}`);
        }
      }
    }

    // Check max 2 adjacent vertically
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        if (
          currentGrid[row][col] &&
          currentGrid[row][col] === currentGrid[row + 1][col] &&
          currentGrid[row][col] === currentGrid[row + 2][col]
        ) {
          newErrors.add(`adj-v-${row}-${col}`);
        }
      }
    }

    setErrors(newErrors);

    // Check if solved
    if (newErrors.size === 0 && isFilled) {
      setGameWon(true);
      if (bestTime === null || timer < bestTime) {
        setBestTime(timer);
        localStorage.setItem(
          "tango-best-time",
          timer.toString(),
        );
      }
    }
  };

  const getConstraintBetween = (
    row1: number,
    col1: number,
    row2: number,
    col2: number,
    dir: "horizontal" | "vertical",
  ) => {
    return CONSTRAINTS.find(
      (c) =>
        c.direction === dir &&
        ((c.cell1.row === row1 &&
          c.cell1.col === col1 &&
          c.cell2.row === row2 &&
          c.cell2.col === col2) ||
          (c.cell2.row === row1 &&
            c.cell2.col === col1 &&
            c.cell1.row === row2 &&
            c.cell1.col === col2)),
    );
  };

  const resetGrid = () => {
    setGrid(STARTING_GRID.map((row) => [...row]));
    setGameWon(false);
    setErrors(new Set());
  };

  const showSolution = () => {
    setGrid(SOLUTION.map((row) => [...row]));
    validateGrid(SOLUTION);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4 flex flex-col overflow-y-auto">
      {/* Start Screen Overlay */}
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-12 shadow-2xl text-center space-y-6 max-w-md mx-4"
            >
              <h1 className="text-5xl font-bold text-blue-600">
                Tango
              </h1>
              <p className="text-gray-700 text-lg">
                Fill the grid with Yourself and me, following the
                classic rules!
              </p>
              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <Play className="w-6 h-6" />
                Start Tango
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Screen */}
      <AnimatePresence>
        {gameWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Floating hearts */}
            <div className="fixed inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: "100%",
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: -window.innerHeight - 100,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 4,
                    ease: "linear",
                    delay: Math.random() * 2,
                    repeat: Infinity,
                  }}
                >
                  <Heart className="w-6 h-6 fill-blue-300 text-blue-300" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-10 shadow-2xl text-center space-y-6 max-w-lg relative z-10"
            >
              <h2 className="text-4xl font-bold text-blue-600">
                Dammmnnn
              </h2>
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>Looks like that was way too easy for you.</p>
                <p>
                  But what else did I expect from the most
                  gorgeous girl in the world. Because thats the
                  second thing i love about you! You are the
                  most beatiful girl i ever lied my eyes on and
                  without a doubt the hottest. Girl everytime
                  you smile at me it gets hard for me to
                  breathe. Talking about hard...
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Your Time:
                  </span>
                  <span className="font-bold text-blue-600 text-xl">
                    {formatTime(timer)}
                  </span>
                </div>
                {bestTime !== null && timer !== bestTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Best Time:
                    </span>
                    <span className="font-bold text-gray-800 text-xl">
                      {formatTime(bestTime)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 bg-white border-2 border-blue-300 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
                <button
                  onClick={() => navigate("/quiz-3")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  Next Quiz
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col pb-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Quiz 2: Tango 💙
          </h1>
          <p className="text-gray-700">
            Solve the logic puzzle!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Thing #2 I love about you...
          </p>

          {/* Timer Display */}
          {gameStarted && (
            <div className="mt-4 inline-block bg-blue-100 px-6 py-2 rounded-full">
              <span className="text-2xl font-bold text-blue-600 tabular-nums">
                {formatTime(timer)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowRules(!showRules)}
          className="mb-4 mx-auto flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <HelpCircle className="w-5 h-5" />
          {showRules ? "Hide Rules" : "Show Rules"}
        </button>

        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4 text-sm space-y-2"
          >
            <p>
              ✓ Each row and column must have 4 Jules and 4 Lors
            </p>
            <p>✓ Max 2 of the same type can be adjacent</p>
            <p>
              ✓ Cells with <strong>=</strong> must be the same
              type
            </p>
            <p>
              ✓ Cells with <strong>X</strong> must be opposite
              types
            </p>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col items-center justify-start">
          <div className="bg-white p-2 rounded-xl shadow-lg mb-4 overflow-x-auto">
            <div className="relative inline-block">
              {/* Grid */}
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isLocked = lockedCells.has(
                      `${rowIndex}-${colIndex}`,
                    );
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="relative"
                      >
                        <button
                          onClick={() =>
                            toggleCell(rowIndex, colIndex)
                          }
                          disabled={gameWon || isLocked}
                          className={`w-11 h-11 border border-gray-300 transition-all relative ${
                            cell === "her"
                              ? "bg-red-200"
                              : cell === "him"
                                ? "bg-blue-200"
                                : "bg-gray-50 hover:bg-gray-100"
                          } ${isLocked ? "ring-2 ring-purple-400" : ""} ${gameWon || isLocked ? "cursor-default" : "active:scale-95 cursor-pointer"}`}
                        >
                          {cell === "her" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={herImage}
                                alt="Her"
                                className="w-8 h-8 rounded-full object-cover border-2 border-red-400"
                              />
                            </div>
                          )}
                          {cell === "him" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={himImage}
                                alt="Him"
                                className="w-8 h-8 rounded-full object-cover border-2 border-blue-400"
                              />
                            </div>
                          )}
                        </button>

                        {/* Horizontal constraints */}
                        {colIndex < GRID_SIZE - 1 &&
                          (() => {
                            const constraint =
                              getConstraintBetween(
                                rowIndex,
                                colIndex,
                                rowIndex,
                                colIndex + 1,
                                "horizontal",
                              );
                            if (constraint) {
                              const constraintIdx =
                                CONSTRAINTS.indexOf(constraint);
                              const hasError = errors.has(
                                `constraint-${constraintIdx}`,
                              );
                              return (
                                <div
                                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                                    hasError
                                      ? "bg-red-500 text-white"
                                      : "bg-yellow-300 text-gray-800"
                                  }`}
                                >
                                  {constraint.type === "="
                                    ? "="
                                    : "X"}
                                </div>
                              );
                            }
                          })()}

                        {/* Vertical constraints */}
                        {rowIndex < GRID_SIZE - 1 &&
                          (() => {
                            const constraint =
                              getConstraintBetween(
                                rowIndex,
                                colIndex,
                                rowIndex + 1,
                                colIndex,
                                "vertical",
                              );
                            if (constraint) {
                              const constraintIdx =
                                CONSTRAINTS.indexOf(constraint);
                              const hasError = errors.has(
                                `constraint-${constraintIdx}`,
                              );
                              return (
                                <div
                                  className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                                    hasError
                                      ? "bg-red-500 text-white"
                                      : "bg-yellow-300 text-gray-800"
                                  }`}
                                >
                                  {constraint.type === "="
                                    ? "="
                                    : "X"}
                                </div>
                              );
                            }
                          })()}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <p className="text-sm text-gray-600">
              Click empty cells to cycle: Empty → Jules → Lor →
              Empty
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Purple border = starting clues (locked)
            </p>
          </div>

          {errors.size > 0 && !gameWon && (
            <div className="mb-4 px-4 py-2 bg-red-100 border-2 border-red-300 rounded-lg text-red-800 text-sm">
              ⚠️ {errors.size} rule violation
              {errors.size !== 1 ? "s" : ""} detected
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={resetGrid}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={showSolution}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors text-sm"
            >
              Show Solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}