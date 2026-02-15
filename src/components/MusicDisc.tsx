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

// Hardcoded tracks from Brent Faiyaz - Icon album (no API needed, no CORS issues)
const ICON_TRACKS: Track[] = [
  {
    title: "white noise.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3e/78/73/3e787372-33fb-c60e-e22c-86cbb21ba466/mzaf_4466674677205288542.plus.aac.p.m4a",
    bpm: 101,
  },
  {
    title: "butterflies.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f3/32/83/f332834c-3754-e745-128b-9cd9db2c8aae/mzaf_9493915808907770813.plus.aac.p.m4a",
    bpm: 92,
  },
  {
    title: "other side.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c8/64/96/c8649664-d968-ea0c-9fbe-58d79a3b9513/mzaf_113675100476796328.plus.aac.p.m4a",
    bpm: 107,
  },
  {
    title: "strangers.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/11/e2/f6/11e2f624-85cd-7084-0e33-19515ab29d55/mzaf_15198436625456586556.plus.aac.p.m4a",
    bpm: 148,
  },
  {
    title: "world is yours.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f7/fa/47/f7fa472a-86da-22ec-097b-40016e38a67a/mzaf_1809133547480313329.plus.aac.p.m4a",
    bpm: 142,
  },
  {
    title: "four seasons.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5f/03/a5/5f03a580-1450-68de-5952-8a3c49f0b2bf/mzaf_3121078119940927117.plus.aac.p.m4a",
    bpm: 93,
  },
  {
    title: "vanilla sky.",
    artist: "Brent Faiyaz",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c9/1a/de/c91ade0e-03e5-ddbc-1637-af6d33943c53/mzaf_1024449120911146213.plus.aac.p.m4a",
    bpm: 91,
  },
];

const MusicDisc = () => {
  const [tracks] = useState<Track[]>(ICON_TRACKS); // Use hardcoded tracks, no API calls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const nowPlayingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Use fake beat detection hook
  const fakeBeat = useFakeBeatDetection();

  // Expose fake beat events globally for StarfieldBackground to consume
  useEffect(() => {
    const unsubscribe = fakeBeat.onBeat((strength) => {
      // Dispatch custom event that StarfieldBackground can listen to
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
              className="group relative h-16 w-16 cursor-pointer rounded-full focus:outline-none"
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
