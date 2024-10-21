'use client'

import React, { useState, useEffect } from 'react'
import { Edit2, Save, Camera, MapPin, Mail, User, Loader2, LogOut, Navigation, FileText, Trash2, Search } from 'lucide-react'
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
import { motion } from 'framer-motion'

interface DashboardData {
  notifications: Notification[]
}

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
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationType, setLocationType] = useState<'manual' | 'coordinates'>('manual')
  const { email, logout } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const geocodeAddress = async (address: string | number | boolean) => {
    setIsGeocodingLoading(true);
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(`https://api.olamaps.io/places/v1/geocode?address=${encodedAddress}&language=en&api_key=G5RJX7p2Bfa2UWJuE73IcyfNokde0j4V9LaoPB9t`);

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.geocodingResults && data.geocodingResults.length > 0) {
        const { lat, lng } = data.geocodingResults[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else {
        throw new Error('No geocoding results found');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const handleLocationChange = (e: { target: { value: any } }) => {
    const newLocation = e.target.value;
    setEditedProfile(prev => prev ? { ...prev, location: newLocation } : null);
  };

  const handleGeocodeClick = async () => {
    if (editedProfile?.location) {
      const coordinates = await geocodeAddress(editedProfile.location);
      if (coordinates) {
        setEditedProfile(prev => prev ? {
          ...prev,
          coordinates: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
        } : null);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();

      console.log('Received profile data:', data);
      const [lat, long] = data.location.split(", ").map(Number);
      console.log('Coordinates:', lat, long);
      const locationName = await fetchAddressFromCoordinates(lat, long);

      setProfile({ ...data, location: locationName });
      setEditedProfile({ ...data, location: locationName });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${email}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notificationData = await response.json();
      console.log('Received notifications:', notificationData);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateNotification = async (notificationId: string, action: 'markAsRead' | 'delete') => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: [notificationId],
          action: action
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification');
      }
      
      // Refresh notifications after update
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
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
        setProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        setEditedProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);

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
      const [lat, long] = data.location.split(", ").map(Number);
      const locationName = await fetchAddressFromCoordinates(lat, long);
      setProfile({ ...data, location: locationName });
      setEditedProfile({ ...data, location: locationName });
      setIsEditing(false);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };



  const handleLogout = () => {
    try {
      logout()
      redirect('/auth')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const fetchAddressFromCoordinates = async (latitude: number, longitude: number) => {
    const response = await fetch('/api/getAddress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });
    const data = await response.json();
    setAddress(data.address);
    return data.address;
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

      const locationName = await fetchAddressFromCoordinates(latitude, longitude);

      if (editedProfile) {
        setEditedProfile({
          ...editedProfile,
          location: locationName,
          coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        console.log('Location updated:', locationName, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to retrieve your location. Please try again or enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!email) return;

    setIsRemovingAvatar(true);

    try {
      const response = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      const data = await response.json();

      setProfile(prev => prev ? { ...prev, avatarUrl: '' } : null);
      setEditedProfile(prev => prev ? { ...prev, avatarUrl: '' } : null);

      const updatedProfile = await handleSaveProfile({ avatarUrl: '' });
      if (updatedProfile) {
        console.log('Profile updated after avatar removal');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your profile..." submessage="Preparing your personal information" />
  }

  if (!profile) return null

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      <Navbar notifications={notifications} />
      <div className="relative z-20 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 pt-20 sm:pt-16 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 w-full max-w-4xl text-center"
        >
          <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <motion.span
              className={cn(
                "bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                "animate-text-gradient"
              )}
              initial={{ backgroundPosition: '0% 50%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              Your Profile
            </motion.span>
          </h1>
          <p className="text-base text-gray-300 sm:text-lg md:text-xl md:max-w-lg mx-auto">
            Manage your personal information
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl"
        >
          <Card className="rounded-3xl shadow-2xl border border-gray-800 bg-gray-900/90 backdrop-blur-sm transition-all duration-300 hover:shadow-purple-500/10">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 border-b border-gray-800">
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 sm:mb-0">
                Profile Details
              </CardTitle>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        disabled={isSaving}
                        className="group relative inline-flex h-10 sm:h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                      >
                        <motion.span
                          className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 sm:px-4 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors hover:bg-slate-900/80">
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          ) : isEditing ? (
                            <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Edit2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                          {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </span>
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
                        className="group relative inline-flex h-10 sm:h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                      >
                        <motion.span
                          className="absolute inset-[-1000%] 
                          bg-[conic-gradient(from_90deg_at_50%_50%,#FF6B6B_0%,#FF8E53_50%,#FF6B6B_100%)]"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 sm:px-4 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors hover:bg-slate-900/80">
                          <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Logout
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logout from your account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-start">
                <div className="relative group flex items-center justify-center w-full md:w-auto md:mr-12 mb-8 md:mb-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <Avatar className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-purple-600/50">
                    <AvatarImage src={profile.avatarUrl} alt={profile.username} className="object-cover" />
                    <AvatarFallback className="text-3xl sm:text-5xl bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-500 text-white">
                      {profile.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 flex gap-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 rounded-full cursor-pointer hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/20">
                              {isUploading ? (
                                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-white" />
                              ) : (
                                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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

                      {profile.avatarUrl && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={handleRemoveAvatar}
                                disabled={isRemovingAvatar}
                                className="w-10 h-10 sm:w-12 sm:h-12 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-red-500/20"
                              >
                                {isRemovingAvatar ? (
                                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-white" />
                                ) : (
                                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove avatar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-6 sm:space-y-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-base sm:text-lg font-medium text-gray-300 flex items-center gap-2">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
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
                          className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 transition-colors text-base sm:text-lg py-2 sm:py-3 text-left"
                        />
                      ) : (
                        <p className="text-gray-200 text-lg sm:text-xl text-left">{profile.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base sm:text-lg font-medium text-gray-300 flex items-center gap-2">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                        Email
                      </Label>
                      <p className="text-gray-200 text-lg sm:text-xl text-left">{profile.email}</p>
                    </div>

                    <div className="space-y-4">
                      <Label
                        htmlFor="bio"
                        className="text-base sm:text-lg font-medium text-gray-300 flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
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
                          className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 min-h-[100px] sm:min-h-[120px] resize-none text-left text-base sm:text-lg"
                        />
                      ) : (
                        <div className="text-left">
                          {profile.bio ? (
                            <p className="text-gray-200 text-base sm:text-lg whitespace-pre-wrap">
                              {profile.bio}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-base sm:text-lg italic">
                              No bio added yet. Click edit to add one!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="location" className="text-base sm:text-lg font-medium text-gray-300 flex items-center gap-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        Location
                      </Label>
                      {isEditing ? (
                        <div className="space-y-4">
                          <Select
                            value={locationType}
                            onValueChange={(value: 'manual' | 'coordinates') => setLocationType(value)}
                          >
                            <SelectTrigger className="w-full bg-gray-800/50 text-gray-200 border-gray-700 text-left text-base sm:text-lg">
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Enter Location Manually</SelectItem>
                              <SelectItem value="coordinates">Use Current Location</SelectItem>
                            </SelectContent>
                          </Select>

                          {locationType === 'manual' ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="location"
                                  value={editedProfile?.location || ''}
                                  onChange={handleLocationChange}
                                  placeholder="Enter your location (e.g., New York, London)"
                                  className="flex-grow bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 text-left text-base sm:text-lg"
                                />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        onClick={handleGeocodeClick}
                                        disabled={isGeocodingLoading || !editedProfile?.location}
                                        className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200"
                                      >
                                        {isGeocodingLoading ? (
                                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                        ) : (
                                          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                        <span className="ml-2 hidden sm:inline">Get Coordinates</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Get coordinates for the entered location</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {editedProfile?.coordinates && (
                                <p className="text-xs sm:text-sm text-gray-400">
                                  Coordinates: {editedProfile.coordinates}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <Input
                                value={editedProfile?.coordinates || ''}
                                readOnly
                                placeholder="Click the button to get your current location"
                                className="bg-gray-800/50 text-gray-200 border-gray-700 rounded-lg focus:border-purple-600 flex-1 text-left text-base sm:text-lg"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={getCurrentLocation}
                                      disabled={isGettingLocation}
                                      className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 w-full sm:w-auto"
                                    >
                                      {isGettingLocation ? (
                                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                      ) : (
                                        <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                                      )}
                                      <span className="ml-2">Get Location</span>
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
                        <p className="text-gray-200 text-base sm:text-lg text-left">
                          {profile?.location}
                          {profile?.coordinates && (
                            <span className="text-xs sm:text-sm text-gray-400 block mt-1">
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
        </motion.div>
      </div>
      <BackgroundBeams className="opacity-50" />
      <motion.div
        className="pointer-events-none absolute inset-0 z-30"
        animate={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
        }}
      />
    </div>
  )
}