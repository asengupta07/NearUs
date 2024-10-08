'use client'

import { motion } from 'framer-motion'
import { BackgroundBeams } from '@/components/ui/background-beams'
import Navbar from '@/components/function/Navbar'
import { FaMapMarkerAlt, FaUsers, FaRoute } from 'react-icons/fa'

export default function HowToUse() {
  const steps = [
    {
      icon: <FaUsers className="text-4xl text-purple-500" />,
      title: "Create a Group",
      description: "Invite your friends or colleagues to join your NearUs group."
    },
    {
      icon: <FaMapMarkerAlt className="text-4xl text-purple-500" />,
      title: "Set Locations",
      description: "Each member adds their starting location to the group."
    },
    {
      icon: <FaRoute className="text-4xl text-purple-500" />,
      title: "Find the Spot",
      description: "NearUs calculates the perfect meetup spot for everyone."
    }
  ]

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      <Navbar />
      <div className="relative z-20 flex h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
              How to Use NearUs
            </span>
          </h1>
          <p className="mb-12 text-lg text-gray-300 sm:text-xl">
            Finding the perfect meetup spot has never been easier. Follow these simple steps to get started with NearUs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 p-6 rounded-lg flex flex-col items-center"
              >
                {step.icon}
                <h3 className="text-xl font-semibold my-4">{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <BackgroundBeams className="opacity-50" />
    </div>
  )
}