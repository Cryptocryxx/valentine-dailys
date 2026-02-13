import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, RotateCcw, Heart } from "lucide-react";

interface Category {
  name: string;
  words: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORIES: Category[] = [
  {
    name: "Dan in a nutshell",
    words: ["Ghost", "Money", "Port", "Steve"],
    color: "blue",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  {
    name: "Shared Hobbies",
    words: ["Tennis", "Pottery", "Movies", "Sex"],
    color: "green",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  {
    name: "Our Kinky To-Do List",
    words: ["Rope", "Candle", "Blindfold", "Toys"],
    color: "yellow",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
  },
  {
    name: "Things I Love About You",
    words: ["Empathy", "Funny", "Gorgeous", "Sassy"],
    color: "purple",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
];

// Shuffle array function
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function Connections() {
  const navigate = useNavigate();
  const [allWords, setAllWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>(
    [],
  );
  const [solvedCategories, setSolvedCategories] = useState<
    Category[]
  >([]);
  const [mistakesLeft, setMistakesLeft] = useState(4);
  const [shakeIncorrect, setShakeIncorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatingWords, setAnimatingWords] = useState<
    string[]
  >([]);
  const [showFailOverlay, setShowFailOverlay] = useState(false);
  const [failPassword, setFailPassword] = useState("");
  const [failPasswordError, setFailPasswordError] = useState(false);
  const [showOneAway, setShowOneAway] = useState(false);

  useEffect(() => {
    // Shuffle all words on initial load
    const words = CATEGORIES.flatMap((cat) => cat.words);
    setAllWords(shuffleArray(words));
  }, []);

  const isWordSolved = (word: string) => {
    return solvedCategories.some((cat) =>
      cat.words.includes(word),
    );
  };

  const isWordAnimating = (word: string) => {
    return animatingWords.includes(word);
  };

  const getCategoryForWord = (word: string) => {
    return CATEGORIES.find((cat) => cat.words.includes(word));
  };

  const toggleWordSelection = (word: string) => {
    if (isWordSolved(word)) return;

    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      if (selectedWords.length < 4) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length !== 4) return;

    // Check if selected words match any category
    const matchedCategory = CATEGORIES.find((category) => {
      const categoryWords = category.words;
      return (
        selectedWords.every((word) =>
          categoryWords.includes(word),
        ) && selectedWords.length === categoryWords.length
      );
    });

    if (matchedCategory) {
      // Correct!
      setSolvedCategories([
        ...solvedCategories,
        matchedCategory,
      ]);
      setSelectedWords([]);

      // Remove solved words from grid
      const remainingWords = allWords.filter(
        (w) => !matchedCategory.words.includes(w),
      );
      setAllWords(remainingWords);

      // Check if all categories solved
      if (solvedCategories.length + 1 === CATEGORIES.length) {
        setGameComplete(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      // Incorrect
      setShakeIncorrect(true);
      setTimeout(() => setShakeIncorrect(false), 500);

      // Check if it was "one away" (3 out of 4 correct)
      const hasOneAway = CATEGORIES.some((category) => {
        const matchCount = selectedWords.filter((word) =>
          category.words.includes(word)
        ).length;
        return matchCount === 3;
      });

      if (hasOneAway) {
        setShowOneAway(true);
        // Hide after a few seconds
        setTimeout(() => setShowOneAway(false), 3000);
      }

      const newMistakes = mistakesLeft - 1;
      setMistakesLeft(newMistakes);

      if (newMistakes === 0) {
        setGameFailed(true);
        setShowFailOverlay(true);
      }
    }
  };

  const handleShuffle = () => {
    setAllWords(shuffleArray(allWords));
  };

  const handleReset = () => {
    const words = CATEGORIES.flatMap((cat) => cat.words);
    setAllWords(shuffleArray(words));
    setSelectedWords([]);
    setSolvedCategories([]);
    setMistakesLeft(4);
    setGameComplete(false);
    setGameFailed(false);
  };

  const deselectAll = () => {
    setSelectedWords([]);
  };

  const handleFailPasswordSubmit = () => {
    if (failPassword.trim().toLowerCase() === "sinaasappel") {
      setShowFailOverlay(false);
      setFailPassword("");
      setFailPasswordError(false);
      handleReset();
    } else {
      setFailPasswordError(true);
      setTimeout(() => setFailPasswordError(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 p-4 flex flex-col items-center justify-center overflow-y-auto">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
              }}
              initial={{ y: -10, rotate: 0, opacity: 1 }}
              animate={{
                y: window.innerHeight + 10,
                rotate: Math.random() * 720 - 360,
                x: Math.random() * 200 - 100,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 2 + 3,
                ease: "linear",
                delay: Math.random() * 0.5,
              }}
            >
              {i % 3 === 0 ? (
                <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
              ) : (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: [
                      "#ff69b4",
                      "#ff1493",
                      "#ffc0cb",
                      "#ff6347",
                      "#ff4500",
                      "#9333ea",
                    ][Math.floor(Math.random() * 6)],
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Fail Overlay with Password */}
      <AnimatePresence>
        {showFailOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-rose-600">
                  Oh no!
                </h2>
                <p className="text-gray-700 text-lg">
                  You ran out of tries! But don't worry, if you know
                  the secret password, you can still continue...
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={failPassword}
                  onChange={(e) => setFailPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleFailPasswordSubmit();
                    }
                  }}
                  placeholder="Enter the secret password"
                  className={`w-full px-4 py-3 border-2 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                    failPasswordError
                      ? "border-red-500 shake"
                      : "border-gray-300"
                  }`}
                />
                {failPasswordError && (
                  <p className="text-red-500 text-sm text-center">
                    Incorrect password. Try again!
                  </p>
                )}
              </div>

              <button
                onClick={handleFailPasswordSubmit}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-rose-600">
            Connections
          </h1>
          <p className="text-gray-700">
            Create four groups of four!
          </p>
          <p className="text-sm text-gray-600">
            Thing #4 I love about you...
          </p>
        </div>

        {/* Solved Categories */}
        <div className="space-y-3">
          <AnimatePresence>
            {solvedCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${category.bgColor} ${category.borderColor} border-2 rounded-xl p-4 shadow-md`}
              >
                <h3 className="font-bold text-center mb-2 text-gray-800">
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {category.words.map((word) => (
                    <span
                      key={word}
                      className={`font-medium uppercase text-sm ${
                        word === "Sassy"
                          ? "text-rose-600 font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Word Grid */}
        {allWords.length > 0 && (
          <motion.div
            animate={
              shakeIncorrect
                ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.4 },
                  }
                : {}
            }
            className="grid grid-cols-4 gap-2 sm:gap-3"
          >
            {allWords.map((word) => {
              const isSelected = selectedWords.includes(word);
              const isAnimating = isWordAnimating(word);
              const isSassy = word === "Sassy";
              return (
                <motion.button
                  key={word}
                  onClick={() => toggleWordSelection(word)}
                  layout
                  className={`
                    aspect-square rounded-xl font-semibold text-sm sm:text-base uppercase relative
                    transition-all duration-200 shadow-md
                    ${
                      isSelected
                        ? isSassy
                          ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white scale-95 shadow-lg"
                          : "bg-pink-400 text-white scale-95 shadow-lg"
                        : isSassy
                          ? "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 border-2 border-rose-400 hover:shadow-xl"
                          : "bg-white text-gray-800 hover:bg-pink-50 hover:shadow-lg"
                    }
                  `}
                  whileHover={{
                    scale: isSelected ? 0.95 : 1.05,
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  {word}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Mistakes Counter */}
        {allWords.length > 0 && (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Mistakes remaining:{" "}
              <span className="font-bold">
                {Array.from({ length: mistakesLeft }).map(
                  (_, i) => (
                    <span key={i} className="text-pink-500">
                      ●
                    </span>
                  ),
                )}
                {Array.from({ length: 4 - mistakesLeft }).map(
                  (_, i) => (
                    <span key={i} className="text-gray-300">
                      ●
                    </span>
                  ),
                )}
              </span>
            </p>
            {/* One Away Hint */}
            {showOneAway && !gameComplete && !gameFailed && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-rose-100 border-2 border-rose-300 text-rose-700 px-6 py-2 rounded-lg font-bold text-lg inline-block"
              >
                One away!
              </motion.div>
            )}
          </div>
        )}

        {/* Controls */}
        {allWords.length > 0 && !gameFailed && (
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleShuffle}
              className="px-6 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Shuffle
            </button>
            <button
              onClick={deselectAll}
              disabled={selectedWords.length === 0}
              className="px-6 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deselect All
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedWords.length !== 4}
              className="px-8 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        )}

        {/* Game Failed Message */}
        {gameFailed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-pink-100 border-2 border-pink-300 rounded-xl p-6 text-center space-y-3"
          >
            <p className="text-2xl font-bold text-rose-600">
              Almost!
            </p>
            <p className="text-gray-700">
              You ran out of tries, but here are all the
              connections!
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors shadow-md flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* Game Complete Message */}
        {gameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-pink-100 to-rose-100 border-2 border-rose-300 rounded-xl p-8 text-center space-y-4">
              <Heart className="w-16 h-16 fill-rose-500 text-rose-500 mx-auto" />
              <p className="text-3xl font-bold text-rose-600">
                You solved it!
              </p>
              <p className="text-xl text-gray-700">
                The 4. Thing i love about you is how Sassy you
                are! Because are you kidding me you make me
                laugh so hard with that shit - i'm literally
                cracking up 80% of the time we're talking and
                thats just because youre so sassy and funny-mean
                to me of course you're jokes are awesome but
                when you're cheeky like that it's so adorable
                that i just know: I found WIFY material right
                here!{" "}
              </p>
            </div>
            <button
              onClick={() => navigate("/quiz-5")}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg"
            >
              Next Quiz <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}