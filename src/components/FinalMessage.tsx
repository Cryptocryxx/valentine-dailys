import { motion } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import couplePhoto from "figma:asset/f3946c983142ea3e348e43ab2682da2aab4b0f86.png";

export function FinalMessage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-purple-100 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className="inline-block mb-6"
        >
          <Heart className="w-20 h-20 text-red-500 fill-red-500" />
        </motion.div>

        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 mb-6">
          You made it!!!
        </h1>
        <h2 className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 mb-6">
          I hope you had fun and i hope we're calling right now.
          say Lor is the best boyfriend in the universe if we
          are. If we're not you better have a good fucking
          excuse! You made this Erasmus what it was and i could
          not imagine a world where i wouldn't have met you
          there and i'm sooooo fucking glad that we met in the
          first week and not at the end or something
        </h2>

        <div className="mb-8 space-y-4 text-left">
          <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-pink-700 mb-2">
                  The 5 Things I Love About You as facts:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>
                    The funniest Person i know!{" "}
                    <strong>FUNNY</strong>
                  </li>
                  <li>
                    The most gorgeous Woman in the entire world
                    WITHOUT exceptions!{" "}
                    <strong>GORGEOUS</strong>
                  </li>
                  <li>
                    No one has ever cared for me and felt with
                    me like you did! <strong>EMPATHY</strong>
                  </li>
                  <li>
                    You're almost as fast and talented with your
                    tongue than me! <strong>SASSY</strong>
                  </li>
                  <li>
                    You are the smartest Women i know!{" "}
                    <strong>SMART</strong>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-64 h-64 mx-auto bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-pink-300 shadow-lg">
            <ImageWithFallback
              src={couplePhoto}
              alt="Me"
              className="w-full h-full object-cover"
              fallbackText="Your Photo Here 💝"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-700 leading-relaxed"
        >
          <p className="text-lg mb-4">
            Thank you for playing through these quizzes! You
            mean the world to me, and I can't wait to share more
            special moments together.
          </p>
          <p className="text-2xl font-bold text-red-500">
            Happy Valentine's Day! ❤️
          </p>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-8 text-4xl"
        >
          💝✨💖
        </motion.div>
      </motion.div>
    </div>
  );
}