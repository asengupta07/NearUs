import { Notification } from '@/app/_models/schema';

async function createNotification(
    recipientId: string,  // Assuming recipientId is a string (like a user ID)
    type: string,         // Assuming type is a string representing notification type
    senderId: string,     // Assuming senderId is a string (like a user ID)
    message: string,      // Assuming message is a string
    eventId: string | null = null  // Optional eventId, can be string or null
  ) {
  const notification = new Notification({
    recipient: recipientId,
    type,
    sender: senderId,
    message,
    eventId,
    read: false,
    status: 'PENDING'
  });

  try {
    await notification.save();
    console.log(`${type} notification created:`, notification);
  } catch (error) {
    console.error(`Error creating ${type} notification:`, error);
  }
}

export { createNotification };