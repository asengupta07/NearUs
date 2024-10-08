'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message: string
  submessage?: string
}

export default function LoadingState({ message, submessage }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Loader2 className="w-16 h-16 text-purple-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-2xl font-semibold"
        >
          {message}
        </motion.h2>
        {submessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-2 text-gray-400"
          >
            {submessage}
          </motion.p>
        )}
      </motion.div>
      <motion.div
        className="mt-8 grid grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1 + index * 0.2, duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              className="h-full bg-purple-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ delay: 1 + index * 0.2, duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}