'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { Edit2, Save, Camera, MapPin, Mail, User, Loader2, LogOut, Navigation, FileText } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import { useAuth } from '@/contexts/authContext'
import { Notification } from '@/types'
import LoadingState from '@/components/LoadingState/LoadingState'
import { redirect } from 'next/navigation'
import { Textarea } from "@/components/ui/textarea"

interface Profile {
  username: string;
  email: string;
  bio: string;
  location: string;
  coordinates?: string;
  avatarUrl: string;
  friendCount: number;
}

export default function Component() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationType, setLocationType] = useState<'manual' | 'coordinates'>('manual')
  const { email, logout } = useAuth()

  useEffect(() => {
    if (email) {
      fetchProfile();
      fetchNotifications();
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
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!email) {
      console.error('User email is not available');
      return;
    }
    try {
      const response = await fetch(`/api/notifications?userId=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: Notification[] = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      const updatedProfile = {
        ...editedProfile,
        ...updatedData,
        // Include both location name and coordinates in the update
        location: editedProfile.location,
        coordinates: editedProfile.coordinates
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setProfile(data);
      setEditedProfile(data);
      setIsEditing(false);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleLogout = () => {
    try {
      logout()
      redirect('/auth')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Get location name from coordinates using reverse geocoding
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
      );
      const data = await response.json();
      const locationName = data.results[0]?.formatted || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      if (editedProfile) {
        setEditedProfile({
          ...editedProfile,
          location: locationName,
          coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to retrieve your location. Please try again or enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your profile..." submessage="Preparing your personal information" />
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar notifications={notifications} />
      <div className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative z-20 max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
              <span className="inline-block bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                Your Profile
              </span>
            </h1>
            <p className="text-gray-400 text-xl">Manage your personal information</p>
          </header>

          <Card className="rounded-3xl shadow-2xl border border-gray-800 bg-gray-900/90 backdrop-blur-sm transition-all duration-300 hover:shadow-purple-500/10">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-gray-800">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Profile Details
              </CardTitle>
              <div className="flex space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/20 text-white font-semibold px-6 py-3 rounded-full"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isEditing ? (
                          <Save className="mr-2 h-5 w-5" />
                        ) : (
                          <Edit2 className="mr-2 h-5 w-5" />
                        )}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isEditing ? 'Save your changes' : 'Edit your profile'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleLogout}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-red-500/20 text-white font-semibold px-6 py-3 rounded-full"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logout from your account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <Avatar className="relative w-48 h-48 rounded-full border-4 border-purple-600/50">
                    <AvatarImage src={profile.avatarUrl} alt={profile.username} className="object-cover" />
                    <AvatarFallback className="text-5xl bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-500 text-white">{profile.username[0]}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="absolute bottom-2 right-2 p-3 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 rounded-full cursor-pointer hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/20">
                            {isUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
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
                <div className="flex-1 space-y-8">
                  <div className="text-center md:text-left space-y-2">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                      {profile.username}
                    </h2>
                    <p className="text-gray-400 text-xl">{profile.friendCount} Friends</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-lg font-medium text-gray-300 flex items-center gap-2">
                        <User className="h-5 w-5 text-cyan-400" />
                        Username
                      </Label>
                      {isEditing ? (
                        <Input
                          id="username"
                          value={editedProfile?.username}
                          onChange={(e) => setEditedProfile(prev => prev ? {
                            ...prev,
                            username: e.target.value
                          } : null)}
                          className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 transition-colors text-lg py-3"
                        />
                      ) : (
                        <p className="text-gray-200 text-xl pl-7">{profile.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-lg font-medium text-gray-300 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-purple-400" />
                        Email
                      </Label>
                      <p className="text-gray-200 text-xl pl-7">{profile.email}</p>
                    </div>

                    <div className="space-y-4">
                      <Label
                        htmlFor="bio"
                        className="text-lg font-medium text-gray-300 flex items-center gap-2"
                      >
                        <FileText className="h-5 w-5 text-pink-400" />
                        About Me
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={editedProfile?.bio || ''}
                          onChange={(e) => setEditedProfile(prev =>
                            prev ? { ...prev, bio: e.target.value } : null
                          )}
                          placeholder="Tell us about yourself..."
                          className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 min-h-[120px] resize-none"
                        />
                      ) : (
                        <div className="pl-7">
                          {profile.bio ? (
                            <p className="text-gray-200 text-xl whitespace-pre-wrap">
                              {profile.bio}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-lg italic">
                              No bio added yet. Click edit to add one!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="location" className="text-lg font-medium text-gray-300 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-cyan-400" />
                        Location
                      </Label>
                      {isEditing ? (
                        <div className="space-y-4">
                          <Select
                            value={locationType}
                            onValueChange={(value: 'manual' | 'coordinates') => setLocationType(value)}
                          >
                            <SelectTrigger className="w-full bg-gray-800/50 text-gray-200 border-gray-700">
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Enter Location Manually</SelectItem>
                              <SelectItem value="coordinates">Use Current Location</SelectItem>
                            </SelectContent>
                          </Select>

                          {locationType === 'manual' ? (
                            <Input
                              id="location"
                              value={editedProfile?.location || ''}
                              onChange={(e) => setEditedProfile(prev => prev ? {
                                ...prev,
                                location: e.target.value,
                                coordinates: undefined
                              } : null)}
                              placeholder="Enter your location (e.g., New York, London)"
                              className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600"
                            />
                          ) : (
                            <div className="flex gap-4 items-center">
                              <Input
                                value={editedProfile?.coordinates || ''}
                                readOnly
                                placeholder="Click the button to get your current location"
                                className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 flex-1"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={getCurrentLocation}
                                      disabled={isGettingLocation}
                                      className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200"
                                    >
                                      {isGettingLocation ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                      ) : (
                                        <Navigation className="h-5 w-5" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Get current location</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-200 text-xl pl-7">
                          {profile?.location}
                          {profile?.coordinates && (
                            <span className="text-sm text-gray-400 block">
                              Coordinates: {profile.coordinates}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <BackgroundBeams />
      </div>
    </div>
  )
}