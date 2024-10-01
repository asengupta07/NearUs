'use client'

import { motion } from 'framer-motion'
import { FlipWords } from '@/components/ui/flip-words'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Navbar'
import Link from 'next/link'


export default function LandingPage() {
  const words = ["Meeting", "Hangout", "Outing"];
  return (
    <div>
      <Navbar />
      <div className="relative h-[90vh] w-full overflow-hidden bg-gray-950 text-white">
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1
            className="mb-6 text-5xl font-bold tracking-tight md:text-6xl"
          >
            <span className={cn(
              "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
              "animate-text-gradient"
            )}>
              Connecting People:<br />One <FlipWords words={words} />at a Time
            </span>
          </motion.h1>
          <p
            className="mb-8 max-w-md text-lg text-gray-300"
          >
            Discover the ideal meetup spot that is convenient for everyone, no matter the distance.
          </p>
          <Link href="/auth">
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              Find the Perfect Spot <span className="ml-2 animate-pulse">🚀</span>
            </span>
          </button>
          </Link>
        </div>
        <BackgroundBeams className="opacity-100" />
      </div>
    </div>
  )
}