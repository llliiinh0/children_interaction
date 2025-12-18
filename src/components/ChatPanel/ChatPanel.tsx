import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types';
import { TTSService } from '../../services/api';
import { AudioManager } from '../../services/audioManager';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePlayAudio = async (message: Message) => {
    if (message.role !== 'assistant' || !message.content) return;

    try {
      // Call TTS service to generate speech
      const audioUrl = await TTSService.textToSpeech(message.content);

      // Use global AudioManager so that starting this audio will stop any other playing audio
      const audio = await AudioManager.playFromUrl(audioUrl);
      audioRefs.current.set(message.id, audio);

      audio.onended = () => {
        audioRefs.current.delete(message.id);
      };

      audio.onerror = () => {
        audioRefs.current.delete(message.id);
        alert('Audio playback failed. Please check TTS API configuration.');
      };
    } catch (error) {
      console.error('Audio playback failed:', error);
      alert('Audio playback failed. Please check TTS API configuration.');
    }
  };

  useEffect(() => {
    return () => {
      // Clean up all audio
      AudioManager.stopAll();
      audioRefs.current.clear();
    };
  }, []);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Chat with StoryBuddy</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            {message.role === 'system' ? (
              <div className="system-message">
                {message.content}
              </div>
            ) : (
              <>
                <div className="message-content">
                  {message.content}
                </div>
                {message.role === 'assistant' && (
                  <button
                    className="audio-play-button"
                    onClick={() => handlePlayAudio(message)}
                    title="Play Audio"
                  >
                    🔊
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              StoryBuddy is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          title="Send"
        >
          ✈️
        </button>
      </div>
    </div>
  );
};

