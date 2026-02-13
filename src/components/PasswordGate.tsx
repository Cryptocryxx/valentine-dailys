import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

export function PasswordGate() {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.toLowerCase() === 'boobies') {
      setIsUnlocking(true);
      // Play door sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.play().catch(() => {});
      
      // Navigate after animation
      setTimeout(() => {
        navigate('/quiz-1');
      }, 2000);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts === 0) {
        setShowHint(true);
      }
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 flex items-center justify-center p-4">
      <AnimatePresence>
        {isUnlocking && (
          <>
            <motion.div
              className="fixed inset-0 bg-pink-900 z-50 origin-center"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transformOrigin: 'center' }}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-red-900 to-pink-800 z-50 border-r-4 border-yellow-600"
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
            >
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-600" />
            </motion.div>
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-red-900 to-pink-800 z-50 border-l-4 border-yellow-600"
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
            >
              <div className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-600" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Heart className="w-16 h-16 text-red-500 fill-red-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Happy Valentine's Day! 💕
          </h1>
          <p className="text-gray-700 leading-relaxed">
            Welcome to your special Valentine's Daily Quizzes! Get ready to discover the five things I love most about you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the password to play your Valentine's Dailys and find out the five things I love most about you!
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Enter password..."
              autoComplete="off"
            />
          </div>

          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-pink-50 border-2 border-pink-300 rounded-lg p-3 text-sm text-pink-800"
            >
              💡 Hint: What we both love VERY much!
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            Unlock Quizzes 🔓
          </button>
        </form>
      </motion.div>
    </div>
  );
}
