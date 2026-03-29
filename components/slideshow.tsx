'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SlideshowItem {
  type: 'image' | 'youtube' | 'youtube-playlist';
  url: string;
  title?: string;
  duration?: number;
}

interface SlideshowProps {
  items: SlideshowItem[];
  interval?: number;
}

export default function Slideshow({ items, interval = 5000 }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // For images or items with explicit duration, use timer
    if (currentItem.type === 'image' || currentItem.duration) {
      const displayDuration = currentItem.duration || interval;
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, displayDuration);
    }
    // For YouTube playlists or single videos without duration, wait for video end
    // Note: Due to iframe restrictions, we can't reliably detect video end
    // So for videos without duration, they will play indefinitely or use a fallback
    else if (currentItem.type === 'youtube' || currentItem.type === 'youtube-playlist') {
      // Set a very long timeout for videos (they'll play continuously)
      // This allows the video to play its full length
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 3600000); // 1 hour fallback
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [items, interval, currentIndex]);

  if (items.length === 0) {
    return null;
  }

  const extractYouTubeEmbedUrl = (url: string, type: string): string => {
    // Handle YouTube playlists
    if (type === 'youtube-playlist') {
      // Extract playlist ID
      const playlistMatch = url.match(/[?&]list=([^&]+)/);
      if (playlistMatch && playlistMatch[1]) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1`;
      }
      // If URL contains playlist but wasn't caught, try to use as is
      if (url.includes('list=')) {
        return url.replace('watch?v=', 'embed/').replace('&list=', '?list=') + '&autoplay=1&loop=1&controls=0';
      }
    }

    // Handle single YouTube videos
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&loop=1&playlist=${match[1]}&controls=0&showinfo=0&rel=0&modestbranding=1`;
      }
    }

    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return url;
  };

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full h-full bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 1,
            ease: [0.43, 0.13, 0.23, 0.96],
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {currentItem.type === 'image' ? (
            <div className="relative w-full h-full">
              <Image
                src={currentItem.url}
                alt={currentItem.title || 'Slideshow image'}
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                src={extractYouTubeEmbedUrl(currentItem.url, currentItem.type)}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentItem.title || currentItem.type === 'youtube-playlist' ? 'YouTube Playlist' : 'YouTube video'}
              />
            </div>
          )}

          {/* Title Overlay */}
          {currentItem.title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute bottom-8 left-0 right-0 text-center"
            >
              <div className="inline-block bg-black/70 backdrop-blur-sm px-8 py-4 rounded-2xl">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-wide">
                  {currentItem.title}
                </h2>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-yellow-400'
                  : 'w-2 bg-white/50'
              }`}
              animate={{
                scale: index === currentIndex ? 1.2 : 1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
