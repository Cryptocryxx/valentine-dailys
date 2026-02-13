import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Clue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
}

const CLUES: Clue[] = [
  // Across
  { number: 1, direction: 'across', clue: 'Christmas gift', answer: 'POTTERY', startRow: 1, startCol: 0 },
  { number: 4, direction: 'across', clue: 'My favourite part of your face', answer: 'EYES', startRow: 2, startCol: 3 },
  { number: 6, direction: 'across', clue: 'What we learned that otters use to open sea urchins', answer: 'ROCK', startRow: 2, startCol: 9 },
  { number: 7, direction: 'across', clue: 'Word of the song we were singing during Karaoke', answer: 'FREE', startRow: 3, startCol: 3 },
  { number: 8, direction: 'across', clue: 'Day that a fresh couple usually doesn\'t spend together', answer: 'CHRISTMAS', startRow: 5, startCol: 3 },
  { number: 9, direction: 'across', clue: 'My favourite part of your body', answer: 'BOOBS', startRow: 6, startCol: 4 },
  
  // Down
  { number: 2, direction: 'down', clue: 'Metro Station with special memories', answer: 'AREEIRO', startRow: 0, startCol: 5 },
  { number: 3, direction: 'down', clue: 'Alcohol brand of us getting first time completely wasted only the two of us', answer: 'BOMBAY', startRow: 1, startCol: 10 },
  { number: 5, direction: 'down', clue: 'Word before Fish of the funny guy that just goes with the flow!', answer: 'SUN', startRow: 5, startCol: 11 },
];

// Special cells that spell "EMPATHY" with numbers (based on the grid)
const EMPATHY_CELLS = [
  { row: 2, col: 3, letter: 'E', number: 1 },  // E from EYES
  { row: 3, col: 10, letter: 'M', number: 2 }, // M from BOMBAY
  { row: 1, col: 0, letter: 'P', number: 3 },  // P from POTTERY
  { row: 0, col: 5, letter: 'A', number: 4 },  // A from AREEIRO
  { row: 1, col: 3, letter: 'T', number: 5 },  // T from POTTERY
  { row: 5, col: 4, letter: 'H', number: 6 },  // H from CHRISTMAS
  { row: 6, col: 10, letter: 'Y', number: 7 }, // Y from BOMBAY
];

const ROWS = 8;
const COLS = 13;

export function Crossword() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState<string[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(''))
  );
  const [gameComplete, setGameComplete] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [solutionWord, setSolutionWord] = useState<string[]>(Array(7).fill(''));
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getCellNumber = (row: number, col: number): number | null => {
    const clue = CLUES.find(c => c.startRow === row && c.startCol === col);
    return clue ? clue.number : null;
  };

  const isBlackCell = (row: number, col: number): boolean => {
    // Check if this cell is used in any word
    for (const clue of CLUES) {
      if (clue.direction === 'across') {
        if (row === clue.startRow && col >= clue.startCol && col < clue.startCol + clue.answer.length) {
          return false;
        }
      } else {
        if (col === clue.startCol && row >= clue.startRow && row < clue.startRow + clue.answer.length) {
          return false;
        }
      }
    }
    return true;
  };

  const getEmpathyCell = (row: number, col: number) => {
    return EMPATHY_CELLS.find(cell => cell.row === row && cell.col === col);
  };

  const getNextCell = (row: number, col: number, direction: 'across' | 'down'): { row: number; col: number } | null => {
    if (direction === 'across') {
      let nextCol = col + 1;
      // Skip over filled cells
      while (nextCol < COLS && !isBlackCell(row, nextCol)) {
        if (!grid[row][nextCol]) {
          return { row, col: nextCol };
        }
        nextCol++;
      }
    } else {
      let nextRow = row + 1;
      // Skip over filled cells
      while (nextRow < ROWS && !isBlackCell(nextRow, col)) {
        if (!grid[nextRow][col]) {
          return { row: nextRow, col };
        }
        nextRow++;
      }
    }
    return null;
  };

  const getPreviousCell = (row: number, col: number, direction: 'across' | 'down'): { row: number; col: number } | null => {
    if (direction === 'across') {
      const prevCol = col - 1;
      if (prevCol >= 0 && !isBlackCell(row, prevCol)) {
        return { row, col: prevCol };
      }
    } else {
      const prevRow = row - 1;
      if (prevRow >= 0 && !isBlackCell(prevRow, col)) {
        return { row: prevRow, col };
      }
    }
    return null;
  };

  const getWordDirection = (row: number, col: number): 'across' | 'down' => {
    // Check if cell belongs to an across word
    const hasAcross = CLUES.some(clue => 
      clue.direction === 'across' && 
      row === clue.startRow && 
      col >= clue.startCol && 
      col < clue.startCol + clue.answer.length
    );
    
    // Check if cell belongs to a down word
    const hasDown = CLUES.some(clue => 
      clue.direction === 'down' && 
      col === clue.startCol && 
      row >= clue.startRow && 
      row < clue.startRow + clue.answer.length
    );

    // If it belongs to both, use the current direction
    if (hasAcross && hasDown) {
      return currentDirection;
    }
    
    // Otherwise use whichever direction it belongs to
    return hasAcross ? 'across' : 'down';
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    const direction = getWordDirection(row, col);

    if (e.key === 'Backspace') {
      e.preventDefault();
      
      // Clear current cell
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = '';
      setGrid(newGrid);
      
      // Update solution box if this is an EMPATHY cell
      const empathyCell = getEmpathyCell(row, col);
      if (empathyCell) {
        const newSolution = [...solutionWord];
        newSolution[empathyCell.number - 1] = '';
        setSolutionWord(newSolution);
      }
      
      // Move to previous cell
      const prevCell = getPreviousCell(row, col, direction);
      if (prevCell) {
        const key = `${prevCell.row}-${prevCell.col}`;
        inputRefs.current[key]?.focus();
      }
      
      checkCompletion(newGrid);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentDirection('across');
      const prevCell = getPreviousCell(row, col, 'across');
      if (prevCell) {
        const key = `${prevCell.row}-${prevCell.col}`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCurrentDirection('across');
      const nextCell = getNextCell(row, col, 'across');
      if (nextCell) {
        const key = `${nextCell.row}-${nextCell.col}`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentDirection('down');
      const prevCell = getPreviousCell(row, col, 'down');
      if (prevCell) {
        const key = `${prevCell.row}-${prevCell.col}`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentDirection('down');
      const nextCell = getNextCell(row, col, 'down');
      if (nextCell) {
        const key = `${nextCell.row}-${nextCell.col}`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!value) return; // Don't process empty values
    
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value.toUpperCase().slice(-1);
    setGrid(newGrid);
    
    // Update solution box if this is an EMPATHY cell
    const empathyCell = getEmpathyCell(row, col);
    if (empathyCell && value) {
      const newSolution = [...solutionWord];
      newSolution[empathyCell.number - 1] = value.toUpperCase();
      setSolutionWord(newSolution);
    }
    
    checkCompletion(newGrid);
    
    // Auto-advance to next cell and maintain direction
    const direction = getWordDirection(row, col);
    setCurrentDirection(direction); // Remember this direction for future cells
    const nextCell = getNextCell(row, col, direction);
    if (nextCell) {
      const key = `${nextCell.row}-${nextCell.col}`;
      inputRefs.current[key]?.focus();
    }
  };

  const handleCellClick = (row: number, col: number) => {
    // Toggle direction if clicking on the same cell
    const key = `${row}-${col}`;
    const currentInput = inputRefs.current[key];
    if (document.activeElement === currentInput) {
      const hasAcross = CLUES.some(clue => 
        clue.direction === 'across' && 
        row === clue.startRow && 
        col >= clue.startCol && 
        col < clue.startCol + clue.answer.length
      );
      
      const hasDown = CLUES.some(clue => 
        clue.direction === 'down' && 
        col === clue.startCol && 
        row >= clue.startRow && 
        row < clue.startRow + clue.answer.length
      );

      if (hasAcross && hasDown) {
        setCurrentDirection(prev => prev === 'across' ? 'down' : 'across');
      }
    }
  };

  const checkCompletion = (currentGrid: string[][]) => {
    const allCorrect = CLUES.every(clue => {
      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.direction === 'down' ? clue.startRow + i : clue.startRow;
        const col = clue.direction === 'across' ? clue.startCol + i : clue.startCol;
        if (currentGrid[row][col] !== clue.answer[i]) {
          return false;
        }
      }
      return true;
    });
    
    if (allCorrect && !gameComplete) {
      setGameComplete(true);
      
      // Heart confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          shapes: ['heart'],
          colors: ['#ff0080', '#ff69b4', '#ff1493', '#c71585'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          shapes: ['heart'],
          colors: ['#ff0080', '#ff69b4', '#ff1493', '#c71585'],
        });
      }, 250);
      
      // Show overlay after 2 seconds delay
      setTimeout(() => {
        setShowWinOverlay(true);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-blue-100 p-4 flex flex-col overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col pb-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-600 mb-2">Quiz 3: Crossword 💚</h1>
          <p className="text-gray-700">Solve the puzzle!</p>
          <p className="text-sm text-gray-600 mt-2">Thing #3 I love about you...</p>
          <p className="text-xs text-purple-600 mt-1">💝 The numbered red circles spell a special word!</p>
        </div>

        {/* Solution Box */}
        <div className="bg-white p-4 rounded-xl shadow-lg mb-4 mx-auto">
          <h3 className="text-center font-bold text-purple-600 mb-2">Solution Word:</h3>
          <div className="flex gap-2 justify-center">
            {solutionWord.map((letter, index) => (
              <div
                key={index}
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-purple-500 rounded-lg flex items-center justify-center bg-purple-50"
              >
                <span className="text-lg sm:text-2xl font-bold text-purple-600">
                  {letter || ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-lg mb-6 mx-auto overflow-x-auto">
          <div className="inline-block">
            <div className="grid gap-0 border-2 border-gray-800" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
              {Array.from({ length: ROWS }).map((_, rowIndex) =>
                Array.from({ length: COLS }).map((_, colIndex) => {
                  const isBlack = isBlackCell(rowIndex, colIndex);
                  const cellNumber = getCellNumber(rowIndex, colIndex);
                  const empathyCell = getEmpathyCell(rowIndex, colIndex);
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-6 h-6 sm:w-10 sm:h-10 border border-gray-400 relative ${
                        isBlack ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      {!isBlack && (
                        <>
                          {cellNumber && (
                            <span className="absolute top-0 left-0.5 text-[7px] sm:text-[10px] font-bold text-gray-600 leading-none">
                              {cellNumber}
                            </span>
                          )}
                          {empathyCell && (
                            <>
                              <div className="absolute inset-0.5 border-2 border-red-500 rounded-full pointer-events-none" />
                              <span className="absolute top-0 right-0.5 text-[7px] sm:text-[10px] font-bold text-red-600 leading-none">
                                {empathyCell.number}
                              </span>
                            </>
                          )}
                          <input
                            ref={(el) => inputRefs.current[`${rowIndex}-${colIndex}`] = el}
                            type="text"
                            value={grid[rowIndex][colIndex]}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            className="w-full h-full text-center text-xs sm:text-lg font-bold uppercase focus:outline-none focus:bg-yellow-100 transition-colors bg-transparent pt-0.5 sm:pt-1"
                            maxLength={1}
                            disabled={gameComplete}
                          />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 max-w-2xl mx-auto w-full">
          <div>
            <h3 className="font-bold text-lg mb-2">Across</h3>
            <div className="space-y-2 text-sm">
              {CLUES.filter(c => c.direction === 'across').map(clue => (
                <div key={`across-${clue.number}`}>
                  <span className="font-semibold">{clue.number}.</span> {clue.clue}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">Down</h3>
            <div className="space-y-2 text-sm">
              {CLUES.filter(c => c.direction === 'down').map(clue => (
                <div key={`down-${clue.number}`}>
                  <span className="font-semibold">{clue.number}.</span> {clue.clue}
                </div>
              ))}
            </div>
          </div>
        </div>

        {gameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 space-y-3 max-w-md mx-auto w-full"
          >
            <div className="px-6 py-3 bg-green-100 border-2 border-green-300 rounded-lg text-green-800 font-semibold text-center">
              🎉 Perfect! You completed the crossword!
              <br />
              <span className="text-purple-600">The numbered letters spell: EMPATHY</span>
            </div>
          </motion.div>
        )}
      </div>

      {showWinOverlay && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-50 to-teal-100 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full border-4 border-green-300"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">Amazing! 💚</h2>
            <div className="text-gray-800 text-left space-y-4 mb-6 text-sm sm:text-base">
              <p>Hope you enjoyed the little couple trivia. You already saw it—the third thing I love about you is your <span className="font-bold text-green-600">empathy</span>.</p>
              <p>How you deeply care for me and for everyone else. But especially me, fuck everyone else.</p>
              <p>I love how you make me feel. How I can be truly myself and don't need to put up a show or a facade because I know you support me no matter what.</p>
              <p>I could cry just thinking about it ;(</p>
              <p className="font-bold text-green-600 text-lg">I Love you &lt;3</p>
            </div>
            <button
              onClick={() => navigate('/quiz-4')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-teal-600 transition-all"
            >
              Next Quiz <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}