import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, Send, Trash2, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';

const TMSChatAssistant = ({ fetchWithAuth, BACKEND_URL }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeContext, setActiveContext] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const contexts = [
    {
      id: 'dispatch',
      label: 'Dispatch Operations',
      icon: '🚚',
      description: 'Route planning, load assignment, driver dispatch'
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: '💰',
      description: 'Invoicing, payments, financial reporting'
    },
    {
      id: 'sales',
      label: 'Sales/Business Development',
      icon: '📈',
      description: 'Lead generation, CRM, rate quotes'
    },
    {
      id: 'hr',
      label: 'HR',
      icon: '👥',
      description: 'Recruitment, training, employee management'
    },
    {
      id: 'maintenance',
      label: 'Fleet Maintenance',
      icon: '🔧',
      description: 'Preventive maintenance, repairs, inspections'
    },
    {
      id: 'safety',
      label: 'Fleet Safety',
      icon: '🛡️',
      description: 'Safety compliance, accident prevention, training'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && activeContext) {
      loadChatHistory();
    }
  }, [isOpen, activeContext]);

  const loadChatHistory = async () => {
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/tms-chat/history?context=${activeContext}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          const formattedMessages = data.history.reverse().flatMap(entry => [
            { role: 'user', content: entry.user_message, timestamp: entry.timestamp },
            { role: 'assistant', content: entry.assistant_response, timestamp: entry.timestamp }
          ]);
          setMessages(formattedMessages);
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to UI
    const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/tms-chat/message`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          context: activeContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to get response');
        // Remove user message if failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error('Error sending message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(`Clear all chat history for ${contexts.find(c => c.id === activeContext)?.label}?`)) {
      return;
    }

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/tms-chat/history?context=${activeContext}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setMessages([]);
        toast.success('Chat history cleared');
      } else {
        toast.error('Failed to clear history');
      }
    } catch (error) {
      toast.error('Error clearing history');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 flex items-center gap-2"
        title="Open AI Chat Assistant"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-semibold">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l z-50 flex transition-all duration-300 ${
      isMinimized ? 'w-16' : 'w-[800px]'
    }`}>
      {!isMinimized && (
        <>
          {/* Left Panel - Context Selection */}
          <div className="w-64 bg-gray-50 border-r flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="font-bold text-gray-900">TMS Departments</h3>
              <p className="text-xs text-gray-600 mt-1">Select a department for specialized assistance</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {contexts.map((context) => (
                <button
                  key={context.id}
                  onClick={() => setActiveContext(context.id)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    activeContext === context.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{context.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">
                        {context.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {context.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {contexts.find(c => c.id === activeContext)?.icon}
                </span>
                <div>
                  <h2 className="font-bold text-gray-900">
                    {contexts.find(c => c.id === activeContext)?.label}
                  </h2>
                  <p className="text-xs text-gray-600">
                    AI-powered assistance • GPT-5 Nano
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {contexts.find(c => c.id === activeContext)?.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Ask me anything about {contexts.find(c => c.id === activeContext)?.label.toLowerCase()}. 
                    I'm here to help with your TMS operations!
                  </p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    {msg.timestamp && (
                      <div className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="w-full flex flex-col items-center py-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="rotate-0"
            title="Maximize"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-vertical transform -rotate-180 text-sm font-semibold text-gray-600 mt-4">
            AI Assistant
          </div>
        </div>
      )}
    </div>
  );
};

export default TMSChatAssistant;
