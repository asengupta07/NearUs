'use client'

import React, { useState, useEffect } from 'react'
import { Edit2, Save, Camera, MapPin, Mail, User, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import { useAuth } from '@/contexts/authContext'

interface Profile {
    username: string;
    email: string;
    bio: string;
    location: string;
    avatarUrl: string;
    friendCount: number;
}

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const { email } = useAuth()

    useEffect(() => {
        if (email) {
            fetchProfile(); // Always fetch from the server
        }
    }, [email]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data); // Update the profile from server
            setEditedProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !email) {
            console.log('Missing file or email:', { file: !!file, email: !!email });
            return;
        }
    
        setIsUploading(true);
        console.log('Starting avatar upload...', { fileName: file.name, fileSize: file.size });
    
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('email', email);
    
        try {
            console.log('Sending request to /api/avatar');
            const response = await fetch('/api/avatar', {
                method: 'POST',
                body: formData,
            });
    
            const data = await response.json();
            console.log('Avatar upload response:', JSON.stringify(data, null, 2));
    
            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload avatar');
            }
    
            if (data.avatarUrl) {
                console.log('Updating profile with new avatar:', data.avatarUrl);
                // Update local state
                setProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
                setEditedProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
                
                // Save the updated profile to the server
                const updatedProfile = await handleSaveProfile({ avatarUrl: data.avatarUrl });
                if (updatedProfile) {
                    console.log('Profile updated with new avatar:', JSON.stringify(updatedProfile, null, 2));
                } else {
                    console.error('Failed to update profile with new avatar');
                }
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };
    
    const handleSaveProfile = async (updatedData?: Partial<Profile>): Promise<Profile | null> => {
        if (!editedProfile) return null;
        setIsSaving(true);
        
        try {
            // Merge updatedData into editedProfile
            const updatedProfile = { ...editedProfile, ...updatedData };
    
            // Ensure location format is correct (latitude, longitude)
            if (updatedProfile.location) {
                const [lat, lon] = updatedProfile.location.split(',').map(n => n.trim());
                updatedProfile.location = `${lat},${lon}`;
            }
    
            // Call updateProfile function to send the update request
            await updateProfile({
                username: updatedProfile.username,
                email: updatedProfile.email,
                bio: updatedProfile.bio,
                location: updatedProfile.location,
                avatarUrl: updatedProfile.avatarUrl,
                friendCount: updatedProfile.friendCount,
            });
    
            // Update the state with the new profile data
            setProfile(updatedProfile);
            setEditedProfile(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
            setIsEditing(false);
            return updatedProfile;
        } catch (error) {
            console.error('Error updating profile:', error);
            return null;
        } finally {
            setIsSaving(false);
        }
    };
    
    // Add this helper function (the provided one) outside of handleSaveProfile
    const updateProfile = async (updatedProfile: Partial<Profile>) => {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile),
        });
    
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
    
        const data = await response.json();
        return data;
    };

    if (!profile) return null

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
            <Navbar notifications={[]} />
            <div className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="relative z-20 max-w-3xl mx-auto">
                    <header className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">
                            <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                                Your Profile
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg">Manage your personal information</p>
                    </header>

                    <Card className="rounded-2xl shadow-2xl border border-purple-500/20 bg-gray-900/90 backdrop-blur-sm transition-all duration-300 hover:shadow-purple-500/10">
                        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-800">
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                                Profile Details
                            </CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                            disabled={isSaving}
                                            className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-purple-500/20"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : isEditing ? (
                                                <Save className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Edit2 className="mr-2 h-4 w-4" />
                                            )}
                                            {isEditing ? 'Save Changes' : 'Edit Profile'}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isEditing ? 'Save your changes' : 'Edit your profile'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                    <Avatar className="relative w-40 h-40 rounded-full border-4 border-purple-600/50">
                                        <AvatarImage src={profile.avatarUrl} alt={profile.username} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-purple-900 text-purple-200">{profile.username[0]}</AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <label className="absolute bottom-2 right-2 p-3 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/20">
                                                        {isUploading ? (
                                                            <Loader2 className="h-6 w-6 animate-spin" />
                                                        ) : (
                                                            <Camera className="h-6 w-6 text-white" />
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleUploadAvatar}
                                                            disabled={isUploading}
                                                        />
                                                    </label>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Upload new avatar</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                        {profile.username}
                                    </h2>
                                    <p className="text-gray-400 text-lg">{profile.friendCount} Friends</p>
                                </div>
                            </div>

                            <div className="mt-12 space-y-8">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <User className="h-4 w-4 text-purple-400" />
                                        Username
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="username"
                                            value={editedProfile?.username}
                                            onChange={(e) => setEditedProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                                            className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-gray-200 text-lg pl-6">{profile.username}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-purple-400" />
                                        Email
                                    </Label>
                                    <p className="text-gray-200 text-lg pl-6">{profile.email}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-purple-400" />
                                        Location
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="location"
                                            value={editedProfile?.location}
                                            onChange={(e) => setEditedProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                                            className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-gray-200 text-lg pl-6">{profile.location}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <BackgroundBeams/>
            </div>
        </div>
    )
}