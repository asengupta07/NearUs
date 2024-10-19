'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Navbar'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const words = ["Meeting", "Hangout", "Outing"];
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const wordVariants = {
    enter: { opacity: 0, scale: 0.9 },
    center: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.1,
      transition: { 
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      <Navbar />
      <div className="relative z-20 flex h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <motion.span
              className={cn(
                "bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                "animate-text-gradient text-6xl"
              )}
              initial={{ backgroundPosition: '0% 50%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              Connecting People
            </motion.span>
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold flex items-center justify-center">
            <span className="mr-2">One&nbsp;</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWordIndex}
                variants={wordVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="inline-block min-w-[180px]"
              >
                {words[currentWordIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="ml-2">&nbsp;at a Time</span>
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 max-w-md text-lg text-gray-300 sm:text-xl md:max-w-lg"
        >
          Discover the ideal meetup spot
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href="/auth">
            <motion.button
              className="group relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
                animate={{
                  rotate: isHovered ? 360 : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-lg font-medium text-white backdrop-blur-3xl transition-all duration-300 ease-in-out group-hover:bg-slate-900/80">
                Find the Perfect Spot 
                <motion.span
                  className="ml-2 inline-block"
                  animate={isHovered ? { x: [0, 4, 0], y: [0, -4, 0] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🚀
                </motion.span>
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
      <BackgroundBeams className="opacity-100" />
      <motion.div
        className="pointer-events-none absolute inset-0 z-30"
        animate={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
        }}
      />
    </div>
  )
}