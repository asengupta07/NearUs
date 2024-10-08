"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FaMapLocationDot } from "react-icons/fa6"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { name: "About Us", href: "/about-us" },
  { name: "How to Use", href: "/how-to-use" },
  { name: "Features", href: "/features" }
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  return (
    <motion.nav
      className={`sticky h-[10vh] top-0 left-0 right-0 z-50 px-6 py-2 transition-all duration-300 ease-in-out ${
        isScrolled ? "bg-gray-900/80 backdrop-blur-md" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex items-center justify-between mx-auto">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="flex items-center space-x-4">
            <FaMapLocationDot className="text-2xl text-purple-600" />
            <span className="text-2xl font-bold text-white">
              Near<span className="text-purple-600">Us</span>
            </span>
          </Link>
        </motion.div>
        <div className="hidden md:flex items-center space-x-6 mr-auto ml-8">
          {navItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.href}
                className="relative text-gray-300 hover:text-white transition-colors duration-300"
              >
                {item.name}
                <motion.span
                  className="absolute left-0 bottom-0 w-full h-0.5 bg-purple-600"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth">
              <Button className="relative overflow-hidden group px-4 py-2">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 transition-all duration-300 ease-out group-hover:opacity-100"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 opacity-0 transition-all duration-300 ease-out group-hover:opacity-75"></span>
                <span className="relative z-10 text-white text-sm font-semibold transition-all duration-300 ease-out group-hover:text-cyan-200">
                  Get Started
                </span>
                <span className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-shimmer"></span>
              </Button>
            </Link>
          </motion.div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-900 text-white">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <motion.div
                      key={item.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={item.href}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/auth">
                      <Button className="w-full relative overflow-hidden group px-4 py-2">
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 transition-all duration-300 ease-out group-hover:opacity-100"></span>
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 opacity-0 transition-all duration-300 ease-out group-hover:opacity-75"></span>
                        <span className="relative z-10 text-white text-sm font-semibold transition-all duration-300 ease-out group-hover:text-cyan-200">
                          Get Started
                        </span>
                        <span className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-shimmer"></span>
                      </Button>
                    </Link>
                  </motion.div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}