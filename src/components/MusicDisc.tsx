import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, SkipForward } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFakeBeatDetection } from "@/lib/useFakeBeatDetection";

interface Track {
  title: string;
  artist: string;
  previewUrl: string;
  bpm: number;
}

// BPM mapping for Brent Faiyaz - Icon tracks
const TRACK_BPM_MAP: Record<string, number> = {
  "white noise": 101,
  "butterflies": 92,
  "other side": 107,
  "strangers": 148,
  "world is yours": 142,
  "four seasons": 93,
  "vanilla sky": 91,
};

const MusicDisc = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nowPlayingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Use fake beat detection hook
  const fakeBeat = useFakeBeatDetection();

  // Fetch tracks from iTunes API
  useEffect(() => {
    fetch("https://itunes.apple.com/search?term=Brent+Faiyaz+Icon&entity=song&limit=25")
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const excludedTracks = ["wrong faces", "have to", "pure fantasy"];
        const filtered = data.results
          ?.filter((r: any) => r.collectionName?.toLowerCase().includes("icon"))
          .filter((r: any) => !excludedTracks.some(excluded => r.trackName?.toLowerCase().includes(excluded)))
          .filter((r: any) => r.previewUrl)
          .map((r: any) => {
            const trackNameLower = r.trackName.toLowerCase();
            // Find BPM from our map
            let bpm = 100; // Default fallback
            for (const [name, trackBpm] of Object.entries(TRACK_BPM_MAP)) {
              if (trackNameLower.includes(name)) {
                bpm = trackBpm;
                break;
              }
            }

            return {
              title: r.trackName,
              artist: r.artistName,
              previewUrl: r.previewUrl,
              bpm,
            };
          });

        if (filtered && filtered.length > 0) {
          setTracks(filtered);
          setError("");
          console.log("Loaded tracks with BPMs:", filtered);
        } else {
          setError("No tracks found");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);
        setError("Failed to load music");
        setIsLoading(false);
      });
  }, []);

  // Expose fake beat events globally for StarfieldBackground to consume
  useEffect(() => {
    const unsubscribe = fakeBeat.onBeat((strength) => {
      // Dispatch custom event that StarfieldBackground can listen to
      console.log('Fake beat generated:', strength);
      window.dispatchEvent(new CustomEvent('musicbeat', { detail: { strength } }));
    });

    return () => {
      unsubscribe();
    };
  }, [fakeBeat]);

  const playTrack = useCallback((track: Track) => {
    if (!audioRef.current) {
      setError("Audio player not ready");
      return;
    }

    audioRef.current.src = track.previewUrl;
    audioRef.current.volume = 0.5;

    audioRef.current.play()
      .then(() => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setShowNowPlaying(true);
        setError("");

        // Start fake beat detection with track's BPM
        console.log(`Starting beat detection at ${track.bpm} BPM for "${track.title}"`);
        fakeBeat.setBPM(track.bpm);
        fakeBeat.start();

        clearTimeout(nowPlayingTimeout.current);
        nowPlayingTimeout.current = setTimeout(() => setShowNowPlaying(false), 3000);
      })
      .catch((err) => {
        console.error("Playback failed:", err);
        setError(`Failed to play: ${track.title}`);
        setIsPlaying(false);
      });
  }, [fakeBeat]);

  const playRandom = useCallback(() => {
    if (tracks.length === 0) {
      setError("No tracks available");
      return;
    }

    // If only one track, play it
    if (tracks.length === 1) {
      playTrack(tracks[0]);
      return;
    }

    // Filter out the current track to avoid repeats
    const availableTracks = currentTrack
      ? tracks.filter(t => t.previewUrl !== currentTrack.previewUrl)
      : tracks;

    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    playTrack(randomTrack);
  }, [tracks, playTrack, currentTrack]);

  const toggle = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      fakeBeat.stop();
    } else {
      if (audioRef.current.src && audioRef.current.currentTime > 0) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setError("");
            fakeBeat.start();
          })
          .catch((err) => {
            console.error("Resume failed:", err);
            setError("Resume failed. Click again to retry.");
          });
      } else {
        playRandom();
      }
    }
  };

  const skip = () => {
    fakeBeat.stop();
    playRandom();
  };

  const handleEnded = () => {
    playRandom();
  };

  const handleError = () => {
    console.error("Audio error for:", currentTrack?.previewUrl);
    setError("Failed to load audio");
    setIsPlaying(false);
    fakeBeat.stop();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isLoading && (
        <div className="mb-1 rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400 backdrop-blur-md">
          Loading tracks...
        </div>
      )}

      {error && (
        <div className="mb-1 max-w-xs rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 backdrop-blur-md">
          {error}
        </div>
      )}

      <div
        className={`pointer-events-none mb-1 max-w-xs rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-md transition-all duration-300 ${showNowPlaying && currentTrack ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
      >
        {currentTrack && (
          <div>
            <div className="font-medium">{currentTrack.title}</div>
            <div className="text-foreground/60">{currentTrack.artist} • {currentTrack.bpm} BPM</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isPlaying && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={skip}
                aria-label="Skip song"
                className="group relative h-12 w-12 cursor-pointer rounded-full focus:outline-none bg-background/50 border border-primary/30 hover:border-primary/60 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
              >
                <SkipForward className="h-4 w-4 text-foreground/70 group-hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="border-border/50 bg-background/90 text-foreground backdrop-blur-md text-xs">
              Skip Song
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              disabled={isLoading}
              className="group relative h-16 w-16 cursor-pointer rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isPlaying ? "shadow-[0_0_20px_hsl(217_91%_60%/0.4),0_0_40px_hsl(217_91%_60%/0.15)] animate-pulse" : ""}`} />
              <div
                className={`absolute inset-0 rounded-full border border-primary/30 transition-all duration-300 group-hover:border-primary/60 ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""}`}
                style={{ background: "radial-gradient(circle, hsl(0 0% 18%) 0%, hsl(0 0% 8%) 40%, hsl(0 0% 4%) 100%)" }}
              >
                <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-4 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[22px] rounded-full border border-white/[0.04]" />
                <div className="absolute inset-5 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-background border border-primary/30" />
                </div>
              </div>
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Volume2 className="h-4 w-4 text-foreground/70" />
                </div>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="border-border/50 bg-background/90 text-foreground backdrop-blur-md text-xs">
            {isPlaying && currentTrack ? (
              <div>
                <div className="font-medium">{currentTrack.title}</div>
                <div className="text-foreground/60 text-[10px]">{currentTrack.artist} • {currentTrack.bpm} BPM</div>
              </div>
            ) : (
              "Play Music"
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      <audio ref={audioRef} onEnded={handleEnded} onError={handleError} className="hidden" />
    </div>
  );
};

export default MusicDisc;
