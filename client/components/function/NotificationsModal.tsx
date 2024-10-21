
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export default function NotificationsModal({ 
  isOpen, 
  onClose, 
  notifications
}: NotificationsModalProps) {
  const renderNotificationActions = (notification: Notification) => {
    if (notification.type === 'NEW_FRIEND_REQUEST') {
      return (
        <div className="mt-2 flex justify-end space-x-2">
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-[#1a1f2e] border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">Notifications</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 max-h-[60vh]">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-[#242b3d] p-4 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.sender.avatarUrl} alt={notification.sender.username} />
                      <AvatarFallback>{notification.sender.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      {notification.event && (
                        <p className="text-xs text-gray-400 mt-1">
                          Event: {notification.event.name} on {new Date(notification.event.date).toLocaleDateString()}
                        </p>
                      )}
                      {renderNotificationActions(notification)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-4">No notifications</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}