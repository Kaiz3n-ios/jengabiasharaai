import React, { useState, useEffect, useRef } from 'react';
import { streamChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './IconComponents';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  const loadingMessages = [
    'Thinking...',
    'Generating response...',
    'Preparing your advice...'
  ];

  useEffect(() => {
      setMessages([{ sender: 'ai', text: "Hello! I'm Jenga, your AI business assistant. How can I help you build today?"}]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    const userMessage: ChatMessage = { sender: 'user', text: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    loadingIntervalRef.current = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500); // Cycle every 2.5 seconds

    try {
      const stream = await streamChatMessage(currentInput);
      let aiResponseText = '';
      let aiMessageExists = false;

      for await (const chunk of stream) {
        aiResponseText += chunk.text;
        if (!aiMessageExists && aiResponseText) {
            // Add the AI message bubble on the first chunk with content
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
            aiMessageExists = true;
        } else if (aiMessageExists) {
            // Update the existing AI message bubble
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = aiResponseText;
                return newMessages;
            });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[60vh] bg-gray-800/50 rounded-lg border border-gray-700">
       <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-amber-400">AI Assistant</h2>
        <p className="text-sm text-gray-400">Ask for marketing, sales, or branding advice.</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-200'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.sender === 'user' && (
             <div className="flex justify-start">
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-gray-700 text-gray-200">
                   <p className="italic text-gray-400">{loadingMessage}</p>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask Jenga for advice..."
            className="flex-1 bg-gray-900 border-gray-600 rounded-full py-2 px-4 focus:ring-amber-500 focus:border-amber-500 text-gray-200"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-gray-900 p-2 rounded-full transition duration-300"
          >
            <PaperAirplaneIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
