import { useState, useEffect, useRef } from "react";
import { Volume2, SkipForward } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAudioAnalysis } from "@/contexts/AudioAnalysisContext";
// @ts-ignore - feed-media-audio-player doesn't have TypeScript definitions
import Feed from "feed-media-audio-player";

const MusicDisc = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string>("");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const nowPlayingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { registerAudioElement, unregisterAudioElement } = useAudioAnalysis();

  useEffect(() => {
    // Initialize Feed.fm player with demo credentials
    const player = new Feed.Player("demo", "demo", {
      debug: true,
    });

    playerRef.current = player;

    // Listen for player events
    player.on("stations", () => {
      console.log("Feed.fm stations loaded");
      setIsReady(true);
      setError("");
    });

    player.on("music-unavailable", () => {
      console.error("Feed.fm music unavailable");
      setError("Music unavailable in your region");
      setIsReady(false);
    });

    player.on("play-started", (play: any) => {
      console.log("Play started:", play);
      const trackName = `${play.audio_file.artist.name} - ${play.audio_file.track.title}`;
      setCurrentTrack(trackName);
      setIsPlaying(true);
      setShowNowPlaying(true);
      clearTimeout(nowPlayingTimeout.current);
      nowPlayingTimeout.current = setTimeout(() => setShowNowPlaying(false), 3000);
    });

    player.on("play-paused", () => {
      console.log("Play paused");
      setIsPlaying(false);
    });

    player.on("play-resumed", () => {
      console.log("Play resumed");
      setIsPlaying(true);
    });

    player.on("play-completed", () => {
      console.log("Play completed");
    });

    player.on("plays-exhausted", () => {
      setError("No more songs available");
    });

    player.on("skip-denied", () => {
      setError("Skip denied - please wait");
      setTimeout(() => setError(""), 3000);
    });

    // Tune to first available station
    player.tune();

    // Get the audio element from Feed.fm player
    // Feed.fm uses an internal audio element that we can access
    const checkAudioElement = setInterval(() => {
      // @ts-ignore - accessing internal property
      const audioEl = player._audioElement || player.audioElement;
      if (audioEl) {
        console.log("Found Feed.fm audio element");
        audioElementRef.current = audioEl;
        registerAudioElement(audioEl);
        clearInterval(checkAudioElement);
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkAudioElement);
      if (playerRef.current) {
        playerRef.current.stop();
      }
      unregisterAudioElement();
    };
  }, [registerAudioElement, unregisterAudioElement]);

  const toggle = () => {
    if (!playerRef.current || !isReady) {
      setError("Player not ready");
      return;
    }

    const state = playerRef.current.getCurrentState();

    if (state === "playing") {
      playerRef.current.pause();
    } else if (state === "paused") {
      playerRef.current.play();
    } else {
      // idle state - start playing
      playerRef.current.play();
    }
  };

  const skip = () => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.skip();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Error toast */}
      {error && (
        <div className="mb-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Now Playing toast */}
      <div
        className={`pointer-events-none mb-1 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-md transition-all duration-300 ${showNowPlaying && currentTrack
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
          }`}
      >
        Now Playing: {currentTrack}
      </div>

      <div className="flex gap-2">
        {/* Skip button */}
        {isPlaying && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={skip}
                aria-label="Skip song"
                className="group relative h-12 w-12 cursor-pointer rounded-full focus:outline-none bg-background/50 border border-primary/30 hover:border-primary/60 transition-all duration-300 flex items-center justify-center"
              >
                <SkipForward className="h-4 w-4 text-foreground/70" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="border-border/50 bg-background/90 text-foreground backdrop-blur-md text-xs"
            >
              Skip Song
            </TooltipContent>
          </Tooltip>
        )}

        {/* Disc */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              className="group relative h-16 w-16 cursor-pointer rounded-full focus:outline-none"
            >
              {/* Glow */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-500 ${isPlaying
                    ? "shadow-[0_0_20px_hsl(217_91%_60%/0.4),0_0_40px_hsl(217_91%_60%/0.15)] animate-pulse"
                    : ""
                  }`}
              />
              {/* Vinyl body */}
              <div
                className={`absolute inset-0 rounded-full border border-primary/30 transition-all duration-300 group-hover:border-primary/60 ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""
                  }`}
                style={{
                  background:
                    "radial-gradient(circle, hsl(0 0% 18%) 0%, hsl(0 0% 8%) 40%, hsl(0 0% 4%) 100%)",
                }}
              >
                {/* Groove rings */}
                <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-4 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[22px] rounded-full border border-white/[0.04]" />

                {/* Label */}
                <div className="absolute inset-5 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
                  {/* Center hole */}
                  <div className="h-2 w-2 rounded-full bg-background border border-primary/30" />
                </div>
              </div>

              {/* Icon overlay when not playing */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Volume2 className="h-4 w-4 text-foreground/70" />
                </div>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="border-border/50 bg-background/90 text-foreground backdrop-blur-md text-xs"
          >
            {isPlaying ? `Now Playing: ${currentTrack}` : "Play Music"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default MusicDisc;
