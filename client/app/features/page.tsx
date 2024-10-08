'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BackgroundBeams } from '@/components/ui/background-beams'
import Navbar from '@/components/function/Navbar'
import { FaMapMarkedAlt, FaClock, FaUserFriends, FaStore, FaCar, FaLock } from 'react-icons/fa'
import LoadingState from '@/components/LoadingState/LoadingState'

export default function Features() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: <FaMapMarkedAlt className="text-4xl text-purple-500" />,
      title: "Smart Location Finder",
      description: "Our algorithm finds the optimal meetup spot based on everyone's location."
    },
    {
      icon: <FaClock className="text-4xl text-purple-500" />,
      title: "Real-time Updates",
      description: "Get instant updates on your group's status and location changes."
    },
    {
      icon: <FaUserFriends className="text-4xl text-purple-500" />,
      title: "Group Management",
      description: "Easily create and manage multiple groups for different social circles."
    },
    {
      icon: <FaStore className="text-4xl text-purple-500" />,
      title: "Venue Suggestions",
      description: "Discover popular meetup spots and read reviews from other users."
    },
    {
      icon: <FaCar className="text-4xl text-purple-500" />,
      title: "Transportation Integration",
      description: "Seamlessly connect with ride-sharing services or public transit options."
    },
    {
      icon: <FaLock className="text-4xl text-purple-500" />,
      title: "Privacy Controls",
      description: "Robust privacy settings to control who sees your location and when."
    }
  ]

  if (isLoading) {
    return <LoadingState message="Loading Features..." submessage="Preparing our amazing features for you" />
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      <Navbar />
      <div className="relative z-20 flex h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
              NearUs Features
            </span>
          </h1>
          <p className="mb-12 text-lg text-gray-300 sm:text-xl">
            Discover the powerful features that make NearUs the ultimate meetup planning tool.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 p-6 rounded-lg flex flex-col items-center"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold my-4">{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <BackgroundBeams className="opacity-50" />
    </div>
  )
}