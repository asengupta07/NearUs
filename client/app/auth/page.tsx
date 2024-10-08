'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Navbar'
import { useAuth } from '@/contexts/authContext'
import { Eye, EyeOff, Mail, User, Lock, Loader2 } from 'lucide-react'

const inputVariants = {
  focus: { scale: 1.05, transition: { type: 'spring', stiffness: 300, damping: 10 } },
  blur: { scale: 1, transition: { type: 'spring', stiffness: 300, damping: 10 } }
}

const buttonVariants = {
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.95, transition: { type: 'spring', stiffness: 400, damping: 10 } }
}

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true)
    const [loginMethod, setLoginMethod] = useState<'username' | 'email'>('email')
    const { login } = useAuth();
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        username: "",
        login: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        setError("");
        setFormData({
            email: "",
            username: "",
            login: "",
            password: "",
            confirmPassword: "",
        });
    }, [isLogin]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setError("Location access is required. Please enable location services.");
                }
            );
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(""); 
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const validateForm = () => {
        if (isLogin) {
            if (!formData.password) {
                setError("Password is required");
                return false;
            }
            if (loginMethod === 'email' && !formData.email) {
                setError("Email is required");
                return false;
            }
            if (loginMethod === 'username' && !formData.username) {
                setError("Username is required");
                return false;
            }
        } else {
            if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
                setError("All fields are required");
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
                return false;
            }
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters long");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;
        if (!location) {
            setError("Location access is required");
            return;
        }

        setIsLoading(true);

        const data = isLogin
            ? {
                identifier: loginMethod === 'email' ? formData.email : formData.username,
                password: formData.password,
                location
            }
            : {
                email: formData.email,
                username: formData.username,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                location
            };

        const endpoint = "/api/auth";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                login(result.token, result.email, result.username);
                router.push("/dashboard");
            } else {
                setError(result.message || "An error occurred");
            }
        } catch (err) {
            setError("Network error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black"> {/* Changed background to black */}
            <Navbar />
            <div className="relative flex min-h-[calc(100vh-64px)] w-full items-center justify-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-md p-4"
                >
                    <Card className="bg-gray-800/80 border-gray-700 shadow-xl backdrop-blur-sm">
                        <CardHeader>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            >
                                <CardTitle className="text-3xl font-bold text-center">
                                    <span className={cn(
                                        "bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent",
                                        "animate-text-gradient"
                                    )}>
                                        {isLogin ? 'Welcome Back!' : 'Join NearUs'}
                                    </span>
                                </CardTitle>
                            </motion.div>
                            <CardDescription className="text-gray-400 text-center">
                                {isLogin ? 'Log in to your account' : 'Create a new account'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Alert variant="destructive" className="mb-4">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                                        <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                            <Input 
                                                                id="username" 
                                                                type="text" 
                                                                required 
                                                                onChange={handleChange} 
                                                                value={formData.username}
                                                                className="bg-gray-700/50 border-gray-600 pl-10" 
                                                                placeholder="Enter your username"
                                                            />
                                                        </motion.div>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="email">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email">Email</Label>
                                                        <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                            <Input 
                                                                id="email" 
                                                                type="email" 
                                                                required 
                                                                onChange={handleChange} 
                                                                value={formData.email}
                                                                className="bg-gray-700/50 border-gray-600 pl-10" 
                                                                placeholder="Enter your email"
                                                            />
                                                        </motion.div>
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                    <Input 
                                                        id="password" 
                                                        type={showPassword ? "text" : "password"}
                                                        required 
                                                        onChange={handleChange} 
                                                        value={formData.password}
                                                        className="bg-gray-700/50 border-gray-600 pl-10 pr-10" 
                                                        placeholder="Enter your password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </motion.div>
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
                                                <Label htmlFor="email">Email</Label>
                                                <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                    <Input 
                                                        id="email" 
                                                        type="email" 
                                                        required 
                                                        onChange={handleChange} 
                                                        value={formData.email}
                                                        className="bg-gray-700/50 border-gray-600 pl-10" 
                                                        placeholder="Enter your email"
                                                    />
                                                </motion.div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="username">Username</Label>
                                                <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                    <Input 
                                                        id="username" 
                                                        type="text" 
                                                        required 
                                                        onChange={handleChange} 
                                                        value={formData.username}
                                                        className="bg-gray-700/50 border-gray-600 pl-10" 
                                                        placeholder="Choose a username"
                                                    />
                                                </motion.div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                    <Input 
                                                        id="password" 
                                                        type={showPassword ? "text" : "password"}
                                                        required 
                                                        onChange={handleChange} 
                                                        value={formData.password}
                                                        className="bg-gray-700/50 border-gray-600 pl-10 pr-10" 
                                                        placeholder="Create a password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </motion.div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                <motion.div className="relative" variants={inputVariants} whileFocus="focus" whileTap="focus">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                    <Input 
                                                        id="confirmPassword" 
                                                        type={showPassword ? "text" : "password"}
                                                        required 
                                                        onChange={handleChange} 
                                                        value={formData.confirmPassword}
                                                        className="bg-gray-700/50 border-gray-600 pl-10 pr-10" 
                                                        placeholder="Confirm your password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <motion.div
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    <Button 
                                        className={cn(
                                            "mt-6 w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
                                            isLoading && "opacity-50 cursor-not-allowed"
                                        )} 
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Loader2 className="w-6 h-6" />
                                            </motion.div>
                                        ) : (
                                            isLogin ? 'Log In' : 'Sign Up'
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <p className="text-sm text-gray-400 text-center w-full">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <Button
                                    variant="link"
                                    className="text-blue-400 hover:text-blue-300 ml-1 font-semibold"
                                    onClick={() => setIsLogin(!isLogin)}
                                    disabled={isLoading}
                                >
                                    {isLogin ? 'Sign up' : 'Log in'}
                                </Button>
                            </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}