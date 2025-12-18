import React, { useState, useCallback } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas/DrawingCanvas';
import { StoryPanel } from './components/StoryPanel/StoryPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EnvChecker } from './components/EnvChecker';
import { Message, Story } from './types';
import { LLMService, VideoService } from './services/api';
import './App.css';

function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m StoryBuddy. Draw something to start our adventure!',
      timestamp: new Date()
    }
  ]);
  
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>(""); // Video generation status description
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentDrawingData, setCurrentDrawingData] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // --- Handle drawing completion ---
  const handleDrawingComplete = useCallback(async (canvasData: string) => {
    setCurrentDrawingData(canvasData);
    setIsGeneratingStory(true);

    try {
      const storyContent = await LLMService.generateStory(
        canvasData,
        story?.content,
        messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        }))
      );

      const newStory: Story = {
        content: storyContent,
        lastModified: new Date()
      };

      setStory(newStory);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Wow! Your drawing is beautiful! Let me create a story for you!',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to generate story:', error);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [story, messages]);

  // --- Handle drawing update ---
  const handleDrawingUpdate = useCallback(async (canvasData: string) => {
    if (!currentDrawingData || !story) {
      handleDrawingComplete(canvasData);
      return;
    }
    setCurrentDrawingData(canvasData);
    setIsGeneratingStory(true);

    try {
      const updatedStoryContent = await LLMService.updateStoryFromDrawing(
        canvasData,
        currentDrawingData,
        story.content
      );

      setStory({ content: updatedStoryContent, lastModified: new Date() });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Drawing updated, and the story has evolved!',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [currentDrawingData, story, messages, handleDrawingComplete]);

  // --- Handle video generation ---
  const handleGenerateVideo = useCallback(async () => {
    if (!story || !currentDrawingData) {
      alert('Please complete your drawing and generate a story first');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoStatus("Starting AI video engine...");
    setCurrentVideoUrl(null); // Clear old video
    setIsVideoModalOpen(true); // Open modal immediately

    try {
      // This await will continue until polling inside VideoService ends
      setVideoStatus("Rendering video, this may take 30-60 seconds...");
      const videoUrl = await VideoService.generateVideo(story.content, currentDrawingData);
      
      if (videoUrl) {
        setCurrentVideoUrl(videoUrl);
        setVideoStatus("Generation successful!");
        
        // Send a system message to chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: 'Magic video generated! Go check it out.',
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      console.error('Failed to generate video:', error);
      setVideoStatus("");
      alert('Failed to generate video: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [story, currentDrawingData]);

  // --- Handle chat messages ---
  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await LLMService.chat(message, messages.map(m => ({ role: m.role, content: m.content })), story?.content);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setIsChatLoading(false);
    }
  }, [messages, story]);

  return (
    <div className="app">
      {import.meta.env.DEV && <EnvChecker />}
      <main className="app-main">
        <div className="left-panel">
          <DrawingCanvas 
            onDrawingComplete={handleDrawingComplete}
            onDrawingUpdate={handleDrawingUpdate}
            hasExistingDrawing={!!currentDrawingData}
          />
        </div>

        <div className="right-panel">
          <div className="story-section">
            <StoryPanel
              story={story}
              onStoryUpdate={(c) => setStory(prev => prev ? {...prev, content: c} : null)}
              onGenerateVideo={handleGenerateVideo}
              isGenerating={isGeneratingVideo}
            />
          </div>

          <div className="chat-section">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          </div>
        </div>
      </main>

      {/* Video modal */}
      {isVideoModalOpen && (
        <div className="video-modal-backdrop">
          <div className="video-modal">
            <button
              className="video-modal-close"
              onClick={() => setIsVideoModalOpen(false)}
              aria-label="Close video"
            >
              ✕
            </button>

            {isGeneratingVideo ? (
              <div className="video-modal-content loading">
                <div className="spinner"></div>
                <p className="video-status-text">{videoStatus}</p>
                <progress className="video-progress"></progress>
              </div>
            ) : currentVideoUrl ? (
              <div className="video-modal-content">
                <h4 className="video-modal-title">🎬 Generated Animation Video</h4>
                <video
                  src={currentVideoUrl}
                  controls
                  autoPlay
                  className="video-modal-player"
                />
                <div className="video-modal-actions">
                  <a href={currentVideoUrl} download="story.mp4" className="download-link">
                    Download Video
                  </a>
                </div>
              </div>
            ) : (
              <div className="video-modal-content">
                <p className="video-status-text">No video available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;