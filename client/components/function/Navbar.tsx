"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaMapLocationDot } from "react-icons/fa6";

export default function Navbar() {
    return (
        <nav className="fixed h-[10vh] top-0 left-0 right-0 z-50 px-6 py-2 transition-all duration-300 ease-in-out bg-transparent flex items-center">
            <div className="container flex items-center justify-between mx-auto">
                <Link href="/" className="flex items-center space-x-4">
                <FaMapLocationDot className="text-2xl text-purple-600" />
                    <span className="text-2xl font-bold text-white">
                        Near<span className="text-purple-600">Us</span>
                    </span>
                </Link>
                <div className="hidden md:flex items-center space-x-6 mr-auto ml-8">
                    {["About Us", "How to Use", "Features"].map((item) => (
                        <Link
                            key={item}
                            href="#"
                            className="relative text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
                        >
                            {item}
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 transform scale-x-0 transition-transform duration-300 origin-left hover:scale-x-100" />
                        </Link>
                    ))}
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/auth">
                    <Button className="text-white bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600">
                        Get Started
                    </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
