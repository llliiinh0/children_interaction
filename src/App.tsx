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

      // Automatically add a user-style message indicating the child has finished the drawing
      const finishedMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: 'I have finished my drawing.',
        timestamp: new Date()
      };

      // Celebrate the drawing and story creation as assistant
      const celebrationMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Wow! Your drawing is beautiful! I have created a story from it!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, finishedMessage, celebrationMessage]);

      // Then, immediately ask guiding questions to spark creativity
      try {
        const guidingQuestions = await LLMService.generateGuidingQuestions(canvasData, storyContent);
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: guidingQuestions,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Failed to generate guiding questions after drawing completion:', error);
      }
    } catch (error) {
      console.error('Failed to generate story:', error);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [story, messages]);

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

    // Detect if the child is explicitly telling StoryBuddy that the drawing is finished
    const isDrawingCompletionMessage = (text: string) => {
      const normalized = text.trim().toLowerCase();

      const englishPatterns = [
        'i have finished this drawing',
        "i've finished this drawing",
        'i finished my drawing',
        "i'm done with this drawing",
        "i'm done with the drawing",
        'i am done with this drawing',
        'i am done with the drawing',
        'i finished drawing',
        'i am done drawing',
        "i'm done drawing"
      ];

      const chinesePatterns = [
        '我已经完成这个画作了',
        '我已经完成这个画作',
        '我已经完成这幅画了',
        '我已经完成这幅画',
        '我已经画完了',
        '我画完了',
        '我画好了',
        '我已经画好了',
        '我已经完成画作了',
        '我已经完成画画了'
      ];

      if (englishPatterns.some(p => normalized.includes(p))) return true;
      if (chinesePatterns.some(p => text.includes(p))) return true;
      return false;
    };

    const isDrawingCompleted = isDrawingCompletionMessage(message);

    try {
      const response = await LLMService.chat(
        message,
        messages.map(m => ({ role: m.role, content: m.content })),
        story?.content,
        currentDrawingData || undefined,
        { isDrawingCompleted }
      );
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setIsChatLoading(false);
    }
  }, [messages, story, currentDrawingData]);

  return (
    <div className="app">
      {import.meta.env.DEV && <EnvChecker />}
      <main className="app-main">
        <div className="left-panel">
          <DrawingCanvas 
            onDrawingComplete={handleDrawingComplete}
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