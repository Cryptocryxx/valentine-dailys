import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  RotateCcw,
  Heart,
  Play,
  X,
} from "lucide-react";
import julesImage from "figma:asset/e0556f0e56888d46d28f148e2a1652873304d22a.png";

// Region definitions
const REGION_GRID = [
  ["B", "B", "P", "K", "K", "W", "P", "P", "P", "B", "B"],
  ["B", "B", "P", "K", "W", "Y", "W", "P", "P", "B", "H"],
  ["B", "B", "P", "W", "Y", "Y", "Y", "W", "P", "B", "H"],
  ["X", "X", "P", "X", "W", "Y", "W", "X", "X", "H", "H"],
  ["X", "X", "X", "X", "X", "W", "X", "H", "H", "H", "H"],
  ["X", "X", "X", "X", "X", "G", "X", "X", "X", "H", "X"],
  ["X", "X", "X", "G", "X", "G", "X", "X", "X", "X", "X"],
  ["X", "D", "X", "X", "G", "G", "G", "X", "X", "L", "X"],
  ["D", "D", "D", "X", "X", "G", "X", "X", "L", "L", "L"],
  ["O", "O", "O", "O", "O", "G", "X", "X", "X", "L", "X"],
  ["O", "O", "O", "O", "O", "O", "O", "O", "X", "L", "X"],
];

const REGION_COLORS: { [key: string]: string } = {
  B: "bg-blue-500",
  P: "bg-purple-500",
  K: "bg-pink-500",
  W: "bg-white",
  Y: "bg-yellow-400",
  H: "bg-orange-200",
  G: "bg-green-400",
  D: "bg-green-700",
  L: "bg-green-200",
  O: "bg-orange-400",
  X: "bg-gray-300",
};

const GRID_SIZE = 11;

interface Position {
  row: number;
  col: number;
}

export function Queens() {
  const navigate = useNavigate();
  const [queens, setQueens] = useState<Set<string>>(new Set());
  const [xMarks, setXMarks] = useState<Set<string>>(new Set());
  const [invalidCell, setInvalidCell] = useState<string | null>(
    null,
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] =
    useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<
    "mark" | "unmark" | null
  >(null);
  const [dragStartCell, setDragStartCell] = useState<
    string | null
  >(null);
  const [hasAppliedStartCell, setHasAppliedStartCell] =
    useState(false);

  // Load best time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("queens-best-time");
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

  // Global touch event handlers for dragging
  useEffect(() => {
    if (!dragStartCell) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const cellButton = element.closest('[data-cell]');
        if (cellButton) {
          const cellKey = cellButton.getAttribute('data-cell');
          if (cellKey) {
            const pos = keyToPos(cellKey);
            handleDragOver(pos.row, pos.col);
          }
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const cellButton = element.closest('[data-cell]');
        if (cellButton) {
          const cellKey = cellButton.getAttribute('data-cell');
          if (cellKey) {
            const pos = keyToPos(cellKey);
            handleDragEnd(pos.row, pos.col);
            return;
          }
        }
      }
      // If we didn't find a cell, just end the drag
      setIsDragging(false);
      setDragMode(null);
      setDragStartCell(null);
      setHasAppliedStartCell(false);
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [dragStartCell, dragMode, xMarks, queens, gameWon, hasAppliedStartCell]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const posToKey = (row: number, col: number) =>
    `${row},${col}`;
  const keyToPos = (key: string): Position => {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  };

  const getRegion = (row: number, col: number) =>
    REGION_GRID[row][col];

  const isAdjacent = (pos1: Position, pos2: Position) => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (
      rowDiff <= 1 &&
      colDiff <= 1 &&
      !(rowDiff === 0 && colDiff === 0)
    );
  };

  const checkValidity = (
    row: number,
    col: number,
    currentQueens: Set<string>,
  ) => {
    const key = posToKey(row, col);

    // Check if already placed
    if (currentQueens.has(key)) {
      return true; // Removing is always valid
    }

    // Check adjacency
    for (const queenKey of currentQueens) {
      const queenPos = keyToPos(queenKey);
      if (isAdjacent({ row, col }, queenPos)) {
        return false;
      }
    }

    // Check row constraint
    let rowCount = 0;
    for (const queenKey of currentQueens) {
      const queenPos = keyToPos(queenKey);
      if (queenPos.row === row) rowCount++;
    }
    if (rowCount >= 1) return false;

    // Check column constraint
    let colCount = 0;
    for (const queenKey of currentQueens) {
      const queenPos = keyToPos(queenKey);
      if (queenPos.col === col) colCount++;
    }
    if (colCount >= 1) return false;

    // Check region constraint
    const region = getRegion(row, col);
    let regionCount = 0;
    for (const queenKey of currentQueens) {
      const queenPos = keyToPos(queenKey);
      if (getRegion(queenPos.row, queenPos.col) === region)
        regionCount++;
    }
    if (regionCount >= 1) return false;

    return true;
  };

  const checkWinCondition = (currentQueens: Set<string>) => {
    // Must have exactly 11 queens
    if (currentQueens.size !== GRID_SIZE) return false;

    // Check all constraints
    const rows = new Set<number>();
    const cols = new Set<number>();
    const regions = new Set<string>();

    for (const queenKey of currentQueens) {
      const pos = keyToPos(queenKey);
      rows.add(pos.row);
      cols.add(pos.col);
      regions.add(getRegion(pos.row, pos.col));
    }

    return (
      rows.size === GRID_SIZE &&
      cols.size === GRID_SIZE &&
      regions.size === GRID_SIZE
    );
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || gameWon) return;

    const key = posToKey(row, col);
    const newQueens = new Set(queens);
    const newXMarks = new Set(xMarks);

    if (queens.has(key)) {
      // Remove queen, go back to empty
      newQueens.delete(key);
      setQueens(newQueens);
    } else if (xMarks.has(key)) {
      // Has X mark, place queen (allow any move)
      newXMarks.delete(key);
      newQueens.add(key);
      setXMarks(newXMarks);
      setQueens(newQueens);

      // Check win condition
      if (checkWinCondition(newQueens)) {
        setGameWon(true);
        if (bestTime === null || timer < bestTime) {
          setBestTime(timer);
          localStorage.setItem(
            "queens-best-time",
            timer.toString(),
          );
        }
      }
    } else {
      // Empty cell, add X mark
      newXMarks.add(key);
      setXMarks(newXMarks);
    }
  };

  const handleStart = () => {
    setGameStarted(true);
    setTimer(0);
  };

  const handleReset = () => {
    setQueens(new Set());
    setXMarks(new Set());
    setTimer(0);
    setGameWon(false);
    setInvalidCell(null);
  };

  const handlePlayAgain = () => {
    setQueens(new Set());
    setXMarks(new Set());
    setTimer(0);
    setGameWon(false);
    setInvalidCell(null);
    setGameStarted(false);
  };

  const isInHoveredRowOrCol = (row: number, col: number) => {
    if (!hoveredCell) return false;
    return hoveredCell.row === row || hoveredCell.col === col;
  };

  const handleDragStart = (row: number, col: number) => {
    if (!gameStarted || gameWon) return;

    const key = posToKey(row, col);
    setDragStartCell(key);

    // Don't allow dragging on queens
    if (queens.has(key)) {
      setDragMode(null);
      return;
    }

    // Set the drag mode based on what's in the cell
    if (xMarks.has(key)) {
      setDragMode("unmark");
    } else {
      setDragMode("mark");
    }
  };

  const handleDragEnd = (row: number, col: number) => {
    const key = posToKey(row, col);

    // If we ended on the same cell we started, treat it as a click
    if (dragStartCell === key) {
      handleCellClick(row, col);
    }

    setIsDragging(false);
    setDragMode(null);
    setDragStartCell(null);
    setHasAppliedStartCell(false);
  };

  const handleDragOver = (row: number, col: number) => {
    const key = posToKey(row, col);

    // If we're moving to a different cell than where we started, enable dragging
    if (dragStartCell && key !== dragStartCell) {
      if (!isDragging) {
        setIsDragging(true);
        setHasAppliedStartCell(true);
      }

      // Apply drag logic
      if (!dragMode || gameWon || queens.has(key)) return;

      const newXMarks = new Set(xMarks);

      if (dragMode === "mark") {
        // Adding X's - include start cell if not already applied
        if (!hasAppliedStartCell) {
          newXMarks.add(dragStartCell);
        }
        if (!xMarks.has(key)) {
          newXMarks.add(key);
        }
      } else if (dragMode === "unmark") {
        // Removing X's - include start cell if not already applied
        if (!hasAppliedStartCell) {
          newXMarks.delete(dragStartCell);
        }
        if (xMarks.has(key)) {
          newXMarks.delete(key);
        }
      }

      setXMarks(newXMarks);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault();
    handleDragStart(row, col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const cellButton = element.closest('[data-cell]');
      if (cellButton) {
        const cellKey = cellButton.getAttribute('data-cell');
        if (cellKey) {
          const pos = keyToPos(cellKey);
          handleDragOver(pos.row, pos.col);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault();
    handleDragEnd(row, col);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 p-4 flex flex-col items-center justify-center overflow-y-auto">
      {/* Start Overlay */}
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-12 shadow-2xl text-center space-y-6 max-w-md mx-4"
            >
              <h1 className="text-5xl font-bold text-rose-600">
                Jules
              </h1>
              <p className="text-gray-700 text-lg">
                Place Queen Jules so that no two Queen touch,
                with one in each row, column, and colored
                region. Who am i telling that you're a pro Have
                fun!
              </p>
              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg"
              >
                <Play className="w-6 h-6" />
                Start Jules
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
                  <Heart className="w-6 h-6 fill-rose-300 text-rose-300" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-10 shadow-2xl text-center space-y-6 max-w-lg relative z-10"
            >
              <h2 className="text-4xl font-bold text-rose-600">
                You solved it.
              </h2>
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Crazy work babe! Didn't expect anything else
                  tho
                </p>
                <p>
                  It's still crazy to me that you told me in the
                  beginning you're not that smart. Honestly
                  after spending 5 Months with you Baby are you
                  out of youre cute fucking mind!
                  <br />
                  Sooooo the 5. thing and probably the most
                  spectacular thing i love about you is how
                  crazy smart you are even if you forget it
                  sometimes. I will always remind you!!!
                </p>
                <p className="font-semibold text-rose-600">
                  Happy Valentine's Day
                </p>
              </div>

              <div className="bg-rose-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Your Time:
                  </span>
                  <span className="font-bold text-rose-600 text-xl">
                    {formatTime(timer)}
                  </span>
                </div>
                {bestTime !== null && (
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
                  className="flex-1 bg-white border-2 border-rose-300 text-rose-600 px-6 py-3 rounded-lg font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
                <button
                  onClick={() => navigate("/final")}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl w-full space-y-6 py-8">
        {/* Header with Timer */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-rose-600">
            Jules
          </h1>

          {gameStarted && (
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-800 tabular-nums">
                {formatTime(timer)}
              </div>
              {bestTime !== null && (
                <div className="text-sm text-gray-600">
                  Best: {formatTime(bestTime)}
                </div>
              )}
            </div>
          )}

          {gameStarted && !gameWon && (
            <button
              onClick={handleReset}
              className="bg-white border-2 border-rose-300 text-rose-600 px-6 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Game Grid */}
        <div className="flex justify-center">
          <div className="inline-block bg-white p-2 sm:p-4 rounded-xl shadow-lg">
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {REGION_GRID.map((row, rowIndex) =>
                row.map((region, colIndex) => {
                  const key = posToKey(rowIndex, colIndex);
                  const hasQueen = queens.has(key);
                  const hasXMark = xMarks.has(key);
                  const isInvalid = invalidCell === key;
                  const isHighlighted = isInHoveredRowOrCol(
                    rowIndex,
                    colIndex,
                  );

                  return (
                    <motion.button
                      key={key}
                      onMouseDown={() =>
                        handleDragStart(rowIndex, colIndex)
                      }
                      onMouseUp={() =>
                        handleDragEnd(rowIndex, colIndex)
                      }
                      onMouseEnter={() => {
                        setHoveredCell({
                          row: rowIndex,
                          col: colIndex,
                        });
                        handleDragOver(rowIndex, colIndex);
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(e, rowIndex, colIndex)}
                      className={`
                        aspect-square w-7 sm:w-10 md:w-12 lg:w-14 
                        ${REGION_COLORS[region]}
                        border border-gray-400
                        relative overflow-hidden
                        transition-all duration-200
                        ${isHighlighted ? "ring-2 ring-rose-400" : ""}
                        ${hasQueen ? "ring-2 ring-rose-500" : ""}
                        hover:brightness-95
                        cursor-pointer
                        select-none
                      `}
                      animate={
                        isInvalid
                          ? {
                              x: [-4, 4, -4, 4, 0],
                              backgroundColor: "#fee",
                            }
                          : {}
                      }
                      transition={{ duration: 0.4 }}
                      data-cell={key}
                    >
                      {hasQueen && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center p-0.5"
                        >
                          <img
                            src={julesImage}
                            alt="Jules"
                            draggable={false}
                            className="w-full h-full object-cover rounded-full border-2 border-rose-400 shadow-lg pointer-events-none"
                          />
                        </motion.div>
                      )}
                      {hasXMark && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <X className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600 stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}