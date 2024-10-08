'use client'

import { motion } from 'framer-motion'
import { BackgroundBeams } from '@/components/ui/background-beams'
import Navbar from '@/components/function/Navbar'

export default function AboutUs() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      <Navbar />
      <div className="relative z-20 flex h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
              About NearUs
            </span>
          </h1>
          <p className="mb-8 text-lg text-gray-300 sm:text-xl">
            NearUs is a revolutionary platform designed to bring people together by finding the perfect meetup spot. Our mission is to make social gatherings easier and more enjoyable for everyone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
              <p>To create a world where distance is no longer a barrier to meaningful connections.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold mb-2">Our Team</h3>
              <p>A diverse group of passionate individuals dedicated to improving social experiences through technology.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold mb-2">Our Values</h3>
              <p>Innovation, inclusivity, and user-centric design are at the core of everything we do.</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <BackgroundBeams className="opacity-50" />
    </div>
  )
}