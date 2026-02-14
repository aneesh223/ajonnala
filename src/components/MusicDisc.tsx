import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAudio } from "@/contexts/AudioContext";

interface Track {
  trackName: string;
  previewUrl: string;
}

const fallbackTracks: Track[] = [
  { trackName: "white noise.", previewUrl: "" },
  { trackName: "butterflies.", previewUrl: "" },
  { trackName: "other side.", previewUrl: "" },
  { trackName: "strangers.", previewUrl: "" },
  { trackName: "world is yours.", previewUrl: "" },
  { trackName: "four seasons.", previewUrl: "" },
  { trackName: "vanilla sky.", previewUrl: "" },
];

const MusicDisc = () => {
  const [tracks, setTracks] = useState<Track[]>(fallbackTracks);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string>("");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nowPlayingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { triggerBeat } = useAudio();

  useEffect(() => {
    const url = encodeURIComponent("https://itunes.apple.com/search?term=Brent+Faiyaz+Icon&entity=song");
    fetch(`https://api.allorigins.win/get?url=${url}`)
      .then((res) => res.json())
      .then((wrapper) => {
        const data = JSON.parse(wrapper.contents);
        const excludedTracks = ["wrong faces", "have to", "pure fantasy"];
        const filtered = data.results
          ?.filter((r: any) => r.collectionName?.toLowerCase().includes("icon"))
          .filter((r: any) => !excludedTracks.some(excluded => r.trackName?.toLowerCase().includes(excluded)))
          .map((r: any) => ({ trackName: r.trackName, previewUrl: r.previewUrl }));
        if (filtered && filtered.length > 0) setTracks(filtered);
      })
      .catch(() => { });
  }, []);

  // Setup audio analysis for beat detection
  useEffect(() => {
    if (!audioRef.current) return;

    const setupAudioContext = () => {
      if (!audioContextRef.current && audioRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    };

    audioRef.current.addEventListener('play', setupAudioContext);
    return () => {
      audioRef.current?.removeEventListener('play', setupAudioContext);
    };
  }, []);

  // Beat detection loop
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let lastBeatTime = 0;
    const minTimeBetweenBeats = 200; // ms

    const detectBeat = () => {
      if (!analyserRef.current || !isPlaying) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Focus on bass frequencies (0-100Hz range)
      const bassRange = dataArray.slice(0, 8);
      const bassAvg = bassRange.reduce((a, b) => a + b, 0) / bassRange.length;

      const now = Date.now();
      if (bassAvg > 180 && now - lastBeatTime > minTimeBetweenBeats) {
        const intensity = Math.min(bassAvg / 255, 1);
        triggerBeat(intensity);
        lastBeatTime = now;
      }

      requestAnimationFrame(detectBeat);
    };

    const animationId = requestAnimationFrame(detectBeat);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, triggerBeat]);

  const playRandom = useCallback(() => {
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    if (!track.previewUrl || !audioRef.current) return;
    audioRef.current.src = track.previewUrl;
    audioRef.current.volume = 0.2;
    audioRef.current.play();
    setCurrentTrack(track.trackName);
    setIsPlaying(true);
    setShowNowPlaying(true);
    clearTimeout(nowPlayingTimeout.current);
    nowPlayingTimeout.current = setTimeout(() => setShowNowPlaying(false), 3000);
  }, [tracks]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src && audioRef.current.currentTime > 0) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playRandom();
      }
    }
  };

  const handleEnded = () => {
    playRandom();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Now Playing toast */}
      <div
        className={`pointer-events-none mb-1 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-md transition-all duration-300 ${showNowPlaying && currentTrack
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
          }`}
      >
        Now Playing: {currentTrack}
      </div>

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

      <audio ref={audioRef} onEnded={handleEnded} className="hidden" />
    </div>
  );
};

export default MusicDisc;
