'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [loginMethod, setLoginMethod] = useState<'username' | 'email'>('username')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Handle form submission logic here
        console.log('Form submitted')
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-950 text-white">
            <BackgroundBeams className="opacity-100" />
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md p-4"
            >
                <Card className="bg-gray-900 border-none">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            <span className={cn(
                                "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                                "animate-text-gradient"
                            )}>
                                {isLogin ? 'Welcome Back!' : 'Join NearUs'}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {isLogin ? 'Log in to your account' : 'Create a new account'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                {isLogin ? (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'username' | 'email')} className="mb-4">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="username">Username</TabsTrigger>
                                                <TabsTrigger value="email">Email</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="username">
                                                <div className="space-y-2">
                                                    <Label htmlFor="username">Username</Label>
                                                    <Input id="username" type="text" required />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="email">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" type="email" required />
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input id="password" type="password" required />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="signup"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" type="text" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-username">Username</Label>
                                            <Input id="signup-username" type="text" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input id="signup-email" type="email" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input id="signup-password" type="password" required />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button className="mt-6 w-full inline-flex h-12 animate-shimmer items-center justify-center rounded-xl border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50" type="submit">

                                {isLogin ? 'Log In' : 'Sign Up'}

                            </button>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <p className="text-sm text-gray-400">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <Button
                                variant="link"
                                className="text-cyan-400 hover:text-cyan-300 ml-1"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </Button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}