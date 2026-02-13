import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const WORD = 'FUNNY';
const MAX_ATTEMPTS = 6;
const RETRY_PASSWORD = 'lor is just a superior human';

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

interface Cell {
  letter: string;
  status: LetterStatus;
}

export function Wordle() {
  const navigate = useNavigate();
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState<Cell[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [message, setMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showRetryOverlay, setShowRetryOverlay] = useState(false);
  const [retryPassword, setRetryPassword] = useState('');
  const [retryError, setRetryError] = useState('');
  const [winAttempts, setWinAttempts] = useState(0);
  const [keyboardStatus, setKeyboardStatus] = useState<Record<string, LetterStatus>>({});

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ];

  // Cookie helper functions
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  // Load failed state from cookie on mount
  useEffect(() => {
    const wordleFailed = getCookie('wordleFailed');
    if (wordleFailed === 'true') {
      setShowRetryOverlay(true);
      setCurrentRow(MAX_ATTEMPTS);
    }
  }, []);

  const getWinMessage = (attempts: number) => {
    let firstLine = '';
    if (attempts <= 2) {
      firstLine = "Naaahhh you're cheating da fuuuuck?!";
    } else if (attempts <= 4) {
      firstLine = "Congrats, easy peasy.";
    } else {
      firstLine = "Whoopsie, better late than never 😂";
    }

    return `${firstLine}\n\nSo I think you figured out the first thing I love about you. And also the order is not random because it's in the order that it came to my mind, and the last one is an exception—it's just the base for all the other ones.\n\nBut yeah, I'll say it: you're funny as fuck. You're hilarious. You're comedic gold. I love that so much about you, and it makes the time we have together always the best time I could imagine.`;
  };

  const checkWordValidity = async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return response.ok;
    } catch (error) {
      console.error('Dictionary API error:', error);
      // If the API fails, allow the word to pass through
      return true;
    }
  };

  const evaluateGuess = (guess: string): Cell[] => {
    const result: Cell[] = [];
    const wordArray = WORD.split('');
    const guessArray = guess.toUpperCase().split('');

    // First pass: mark correct letters
    const remaining = [...wordArray];
    guessArray.forEach((letter, i) => {
      if (letter === wordArray[i]) {
        result[i] = { letter, status: 'correct' };
        remaining[i] = '';
      } else {
        result[i] = { letter, status: 'absent' };
      }
    });

    // Second pass: mark present letters
    guessArray.forEach((letter, i) => {
      if (result[i].status === 'absent') {
        const index = remaining.indexOf(letter);
        if (index !== -1) {
          result[i] = { letter, status: 'present' };
          remaining[index] = '';
        }
      }
    });

    return result;
  };

  const updateKeyboardStatus = (evaluated: Cell[]) => {
    const newStatus = { ...keyboardStatus };
    evaluated.forEach(cell => {
      const letter = cell.letter;
      const currentStatus = newStatus[letter];
      
      // Priority: correct > present > absent
      if (cell.status === 'correct') {
        newStatus[letter] = 'correct';
      } else if (cell.status === 'present' && currentStatus !== 'correct') {
        newStatus[letter] = 'present';
      } else if (!currentStatus) {
        newStatus[letter] = cell.status;
      }
    });
    setKeyboardStatus(newStatus);
  };

  const handleKeyPress = (key: string) => {
    if (gameWon || currentRow >= MAX_ATTEMPTS || isValidating) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = async () => {
    if (currentGuess.length !== 5) {
      setMessage('Word must be 5 letters!');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setIsValidating(true);
    const isValid = await checkWordValidity(currentGuess);
    setIsValidating(false);

    if (!isValid) {
      setMessage('Invalid word!');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const evaluated = evaluateGuess(currentGuess);
    updateKeyboardStatus(evaluated);
    setGuesses([...guesses, evaluated]);
    
    if (currentGuess.toUpperCase() === WORD) {
      setGameWon(true);
      setMessage('Correct! You found it! 🎉');
      setWinAttempts(currentRow + 1);
      
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
    } else if (currentRow === MAX_ATTEMPTS - 1) {
      setMessage(`Game over! The word was ${WORD}`);
      setShowRetryOverlay(true);
      setCookie('wordleFailed', 'true', 1);
    }

    setCurrentGuess('');
    setCurrentRow(prev => prev + 1);
  };

  const getStatusColor = (status: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-green-500 border-green-600 text-white';
      case 'present': return 'bg-yellow-400 border-yellow-500 text-white';
      case 'absent': return 'bg-gray-400 border-gray-500 text-white';
      default: return 'bg-white border-gray-300';
    }
  };

  const renderGrid = () => {
    const rows = [];
    
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const cells = [];
      
      if (i < guesses.length) {
        // Submitted guess
        for (let j = 0; j < 5; j++) {
          const cell = guesses[i][j];
          cells.push(
            <motion.div
              key={j}
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 360 }}
              transition={{ duration: 0.5, delay: j * 0.1 }}
              className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded ${getStatusColor(cell.status)}`}
            >
              {cell.letter}
            </motion.div>
          );
        }
      } else if (i === currentRow) {
        // Current guess being typed
        for (let j = 0; j < 5; j++) {
          cells.push(
            <div
              key={j}
              className="w-14 h-14 border-2 border-gray-400 flex items-center justify-center text-2xl font-bold rounded bg-white"
            >
              {currentGuess[j]?.toUpperCase() || ''}
            </div>
          );
        }
      } else {
        // Empty rows
        for (let j = 0; j < 5; j++) {
          cells.push(
            <div
              key={j}
              className="w-14 h-14 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold rounded bg-white"
            />
          );
        }
      }
      
      rows.push(
        <div key={i} className="flex gap-2 justify-center">
          {cells}
        </div>
      );
    }
    
    return rows;
  };

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (retryPassword === RETRY_PASSWORD) {
      setGuesses([]);
      setCurrentRow(0);
      setGameWon(false);
      setMessage('');
      setShowRetryOverlay(false);
      setKeyboardStatus({});
      deleteCookie('wordleFailed'); // Delete the cookie
    } else {
      setRetryError('Incorrect password!');
      setTimeout(() => setRetryError(''), 2000);
    }
  };

  const getKeyColor = (key: string) => {
    if (key === 'ENTER' || key === '⌫') {
      return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    }
    
    const status = keyboardStatus[key];
    if (!status) {
      return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    }
    
    switch (status) {
      case 'correct':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'present':
        return 'bg-yellow-400 hover:bg-yellow-500 text-white';
      case 'absent':
        return 'bg-gray-400 hover:bg-gray-500 text-white';
      default:
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-red-100 p-4 flex flex-col">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">Quiz 1: Wordle 💜</h1>
          <p className="text-gray-700">Guess the word in 6 tries!</p>
          <p className="text-sm text-gray-600 mt-2">Thing #1 I love about you...</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start">
          <div className="space-y-2 mb-6">
            {renderGrid()}
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-2 bg-pink-100 border-2 border-pink-300 rounded-lg text-pink-800 font-semibold"
            >
              {message}
            </motion.div>
          )}

          {!gameWon && currentRow < MAX_ATTEMPTS && (
            <div className="w-full max-w-lg space-y-2">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      disabled={isValidating}
                      className={`${
                        key === 'ENTER' || key === '⌫'
                          ? 'px-3 sm:px-4 min-w-[60px] sm:min-w-[70px]'
                          : 'w-8 sm:w-10'
                      } h-12 sm:h-14 rounded font-bold text-sm sm:text-base transition-colors ${getKeyColor(key)} disabled:opacity-50`}
                    >
                      {key === 'ENTER' ? 'ENTER' : key}
                    </button>
                  ))}
                </div>
              ))}
              {isValidating && (
                <p className="text-center text-purple-600 font-semibold">Checking...</p>
              )}
            </div>
          )}

          {gameWon && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate('/quiz-2')}
              className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Next Quiz <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {showWinOverlay && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-pink-50 to-purple-100 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full border-4 border-purple-300"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-4">You Did It! 💜</h2>
            <div className="text-gray-800 text-left space-y-4 whitespace-pre-line mb-6">
              {getWinMessage(winAttempts)}
            </div>
            <button
              onClick={() => navigate('/quiz-2')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Next Quiz <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}

      {showRetryOverlay && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-pink-50 to-purple-100 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border-4 border-red-300"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4">Oops! 😬</h2>
            <p className="text-gray-700 mb-6 text-lg">Ask Daddy for one more try! But ask nicely 😏</p>
            <form onSubmit={handleRetrySubmit} className="space-y-4">
              <input
                type="text"
                value={retryPassword}
                onChange={(e) => setRetryPassword(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg text-center text-xl font-semibold focus:outline-none focus:border-purple-500"
                placeholder="Enter password"
                autoFocus
              />
              {retryError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 font-semibold"
                >
                  {retryError}
                </motion.p>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Submit
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}