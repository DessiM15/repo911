'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';

const STORAGE_KEY = 'repo911_loading_played';
const TOTAL_DURATION = 5000; // overlay removed from DOM after fade completes

export default function LoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Skip if already played this session
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setShow(false);
        return;
      }
    } catch {
      setShow(false);
      return;
    }

    // Skip for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
      setShow(false);
      return;
    }

    // Pick mobile or desktop assets
    const isMobile = window.innerWidth < 768;
    const video = videoRef.current;
    if (video) {
      video.src = isMobile
        ? '/videos/loading-screen-mobile.mp4'
        : '/videos/loading-screen.mp4';
      video.poster = isMobile
        ? '/videos/loading-screen-poster-mobile.jpg'
        : '/videos/loading-screen-poster.jpg';

      // Play programmatically to catch autoplay rejections
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — skip loading screen gracefully
          try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
          setShow(false);
        });
      }
    }

    // Remove overlay from DOM after animation completes
    const timer = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }, TOTAL_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Homepage content — fades in via CSS */}
      <div className={show ? 'ls-content' : undefined}>
        {children}
      </div>

      {/* Loading screen overlay — entirely CSS-animated, removed from DOM when done */}
      {show && (
        <div
          ref={overlayRef}
          aria-hidden="true"
          role="presentation"
          className="ls-overlay"
        >
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster="/videos/loading-screen-poster.jpg"
            className="ls-video"
          />

          {/* Text overlay */}
          <div className="ls-text-container">
            <h1 className="ls-title">
              <Shield className="ls-shield" />
              <span>Repo<span className="ls-title-accent">911</span></span>
            </h1>
            <p className="ls-tagline">Fight Back Against Wrongful Repossession</p>
          </div>
        </div>
      )}
    </>
  );
}
