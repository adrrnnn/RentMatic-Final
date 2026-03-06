"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Lightbulb, BarChart3, Home, Users, Menu, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import AIAssistant from './components/AIAssistant';

export default function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const quickActions = [
    {
      icon: Home,
      title: 'Create Property',
      description: 'Add a new rental property',
      prompt: 'Create a new property called "Sunset Apartments" with 20 units'
    },
    {
      icon: Users,
      title: 'Add Tenant',
      description: 'Register a new tenant',
      prompt: 'Add a new tenant named John Doe with email john@example.com'
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Get property insights',
      prompt: 'Show me analytics for all properties'
    },
    {
      icon: Bot,
      title: 'General Help',
      description: 'Ask anything about property management',
      prompt: 'How can I improve my rental property management?'
    }
  ];

  const handleAction = (action: string, parameters: Record<string, unknown>) => {
    console.log('AI Action:', action, parameters);
    // Here you would integrate with your actual services
    // For now, we'll just log the action
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">RentMatic AI</h1>
              <p className="text-sm text-gray-500">Property Management Assistant</p>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transition-none`}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        onClick={() => {
                          console.log('Quick action:', action.prompt);
                        }}
                        variant="outline"
                        className="w-full justify-start p-3 h-auto text-left"
                      >
                        <div className="flex items-start space-x-3">
                          <action.icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{action.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI Capabilities */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  AI Capabilities
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">Create and manage properties</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">Add and assign tenants</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">Generate analytics and reports</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">Answer property management questions</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">AI Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gemini AI</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-600">Ready</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backup Bot</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm text-yellow-600">Standby</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <AIAssistant onAction={handleAction} />
          </div>
        </div>
      </div>
    </div>
  );
}