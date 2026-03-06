"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { AIService } from '@/lib/services/aiService';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  parameters?: Record<string, unknown>;
  isTyping?: boolean;
}

interface AIAssistantProps {
  onAction?: (action: string, parameters: Record<string, unknown>) => void;
}

export default function AIAssistant({ onAction }: AIAssistantProps) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! 👋 I\'m your RentMatic AI Assistant, and I\'m excited to help you manage your properties, units, and tenants! 🏠✨ What would you like to work on today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiAvailable, setIsGeminiAvailable] = useState(false);
  const [actionStatus, setActionStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsGeminiAvailable(AIService.isGeminiReady());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history from previous messages
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => `${msg.role}: ${msg.content}`)
        .slice(-10); // Keep last 10 messages for context

      const response = await AIService.sendMessageWithHistory(inputMessage, conversationHistory, user?.id);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        action: response.action,
        parameters: response.parameters
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Execute action if provided
      if (response.action && response.action !== 'ANSWER_QUESTION' && response.action !== 'ERROR') {
        setActionStatus(prev => ({ ...prev, [assistantMessage.id]: 'pending' }));
        
        try {
          const actionResult = await AIService.executeAction(response.action, response.parameters || {}, {}, user?.id);
          
          if (actionResult.success) {
            setActionStatus(prev => ({ ...prev, [assistantMessage.id]: 'success' }));
            
            // Show specific success messages based on action
            if (response.action === 'CREATE_TENANT') {
              toast.success('Tenant created successfully! Check the Tenants tab to see the new tenant.');
            } else if (response.action === 'CREATE_PROPERTY') {
              toast.success('Property created successfully! Check the Properties tab to see the new property.');
            } else if (response.action === 'CREATE_UNIT') {
              toast.success('Unit created successfully! Check the Properties tab to see the new unit.');
            } else if (response.action === 'SEARCH_TENANTS') {
              // For search results, show the actual results in the chat
              console.log('Search action result:', actionResult);
              
              if (actionResult.data && actionResult.data.results) {
                const searchResults = actionResult.data.results;
                console.log('Search results:', searchResults);
                
                if (Array.isArray(searchResults) && searchResults.length > 0) {
                  const tenantDetails = searchResults.map((tenant: { fullName: string; contact?: { email?: string } }) => 
                    `• ${tenant.fullName} (${tenant.contact?.email || 'No email'})`
                  ).join('\n');
                  const resultMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `🔍 Search Results for "${actionResult.data.query}":\n\nFound ${searchResults.length} tenant(s):\n${tenantDetails}`,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, resultMessage]);
                } else if (Array.isArray(searchResults) && searchResults.length === 0) {
                  const noResultsMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `🔍 No tenants found matching "${actionResult.data.query}". You can create a new tenant or check the Tenants tab to see all your tenants.`,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, noResultsMessage]);
                } else {
                  // Handle case where results is not an array (fallback message)
                  const fallbackMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `🔍 ${actionResult.message}`,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, fallbackMessage]);
                }
              } else {
                // Handle case where no data is returned
                const fallbackMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  role: 'assistant',
                  content: `🔍 ${actionResult.message}`,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, fallbackMessage]);
              }
              toast.success('Search completed!');
            } else {
              toast.success('Action completed successfully!');
            }
            
            if (onAction) {
              onAction(response.action, response.parameters || {});
            }
          } else {
            setActionStatus(prev => ({ ...prev, [assistantMessage.id]: 'error' }));
            toast.error(actionResult.message);
          }
        } catch (error) {
          console.error('Action execution error:', error);
          setActionStatus(prev => ({ ...prev, [assistantMessage.id]: 'error' }));
          toast.error('Failed to execute action');
        }
      }
    } catch (error) {
      console.error('AI Service error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! 👋 I\'m your RentMatic AI Assistant, and I\'m excited to help you manage your properties, units, and tenants! 🏠✨ What would you like to work on today?',
        timestamp: new Date()
      }
    ]);
    setActionStatus({});
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-500 ml-3' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 mr-3'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {/* Action Status */}
                    {message.action && message.action !== 'ANSWER_QUESTION' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">
                          Action: {message.action}
                        </span>
                        {actionStatus[message.id] && (
                          <div className={`flex items-center space-x-1 ${
                            actionStatus[message.id] === 'success' ? 'text-green-600' :
                            actionStatus[message.id] === 'error' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              actionStatus[message.id] === 'success' ? 'bg-green-500' :
                              actionStatus[message.id] === 'error' ? 'bg-red-500' :
                              'bg-yellow-500 animate-pulse'
                            }`} />
                            <span className="text-xs font-medium">
                              {actionStatus[message.id] === 'success' ? 'Completed' :
                               actionStatus[message.id] === 'error' ? 'Failed' :
                               'Processing...'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-6"
              >
                <div className="flex max-w-[80%] flex-row">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mr-3 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                className="w-full p-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px] max-h-32"
                placeholder={isGeminiAvailable ? "Ask me anything about property management..." : "AI is in standby. Ask me anything about property management..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Status and Clear */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isGeminiAvailable ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-xs text-gray-500">
                {isGeminiAvailable ? 'Gemini AI Ready' : 'Using Backup Bot'}
              </span>
            </div>
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Chat</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}