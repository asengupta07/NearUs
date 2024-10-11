import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, FileText, X, UserPlus, Calendar } from "lucide-react";
import Link from 'next/link';

interface User {
    id: string;
    username: string;
    avatarUrl: string;
    bio?: string;
    joinDate?: string;
    mutualFriends?: number;
}

interface FriendProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    friend: User | null;
}

export default function FriendProfileModal({ isOpen, onClose, friend }: FriendProfileModalProps) {
    if (!friend) {
        return null;
    }

    const defaultBio = "No bio added yet...";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 text-white max-w-md">
                <DialogHeader className="flex justify-between items-center">
                    <DialogTitle className="text-xl font-bold">Friend Profile</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col items-center space-y-6 p-4">
                    <Avatar className="w-24 h-24 border-2 border-purple-500">
                        <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                        <AvatarFallback className="bg-purple-700 text-white text-2xl">
                            {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-semibold">{friend.username}</h3>
                    </div>

                    <Card className="w-full bg-gray-800 border-none">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{friend.bio || defaultBio}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex space-x-3 w-full">
                        <Link href={`/chat/${friend.id}`} className="flex-1">
                            <Button variant="default" className="w-full space-x-2">
                                <MessageCircle className="h-4 w-4" />
                                <span>Send Message</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}