import React, { useState, useRef, useEffect } from 'react';
import { Story } from '../../types';
import { TTSService } from '../../services/api';
import './StoryPanel.css';

interface StoryPanelProps {
  story: Story | null;
  onStoryUpdate: (content: string) => void;
  onGenerateVideo: () => void;
  isGenerating: boolean;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({
  story,
  onStoryUpdate,
  onGenerateVideo,
  isGenerating
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (story) {
      setEditedContent(story.content);
    }
  }, [story]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onStoryUpdate(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (story) {
      setEditedContent(story.content);
    }
    setIsEditing(false);
  };

  const handlePlayAudio = async () => {
    if (!story || !story.content) return;

    try {
      setIsPlaying(true);
      
      // Call TTS service to generate speech
      const audioUrl = await TTSService.textToSpeech(story.content);
      
      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        alert('Audio playback failed. Please check TTS API configuration.');
      };
      
      await audio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
      alert('Audio playback failed. Please check TTS API configuration.');
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="story-panel">
      <div className="story-header">
        <h3>
          <span className="book-icon">📖</span>
          Our Story
        </h3>
        <div className="story-controls">
          <button
            className="control-button audio-button"
            onClick={isPlaying ? handleStopAudio : handlePlayAudio}
            title={isPlaying ? 'Stop Playing' : 'Play Audio'}
          >
            {isPlaying ? '⏸️' : '🔊'}
          </button>
          <button
            className="control-button edit-button"
            onClick={isEditing ? handleSave : handleEdit}
            title={isEditing ? 'Save' : 'Edit'}
          >
            {isEditing ? '💾' : '✏️'}
          </button>
          {isEditing && (
            <button
              className="control-button cancel-button"
              onClick={handleCancel}
              title="Cancel"
            >
              ✕
            </button>
          )}
          <button
            className="control-button movie-button"
            onClick={onGenerateVideo}
            disabled={!story || isGenerating}
            title="Generate Video"
          >
            🎬 Video
          </button>
        </div>
      </div>
      
      <div className="story-content-wrapper">
        {story ? (
          isEditing ? (
            <textarea
              className="story-edit-textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your story..."
            />
          ) : (
            <div className="story-content">
              {story.content}
            </div>
          )
        ) : (
          <div className="story-placeholder">
            Complete your drawing and the story will appear here...
          </div>
        )}
      </div>
    </div>
  );
};

