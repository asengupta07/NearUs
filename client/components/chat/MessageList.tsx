import React from 'react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-2 ${
            message.sender === currentUserId ? 'text-right' : 'text-left'
          }`}
        >
          <div
            className={`inline-block p-2 rounded-lg ${
              message.sender === currentUserId
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;