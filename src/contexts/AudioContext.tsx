import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AudioContextType {
    beatIntensity: number;
    triggerBeat: (intensity: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const [beatIntensity, setBeatIntensity] = useState(0);

    const triggerBeat = useCallback((intensity: number) => {
        setBeatIntensity(intensity);
        setTimeout(() => setBeatIntensity(0), 100);
    }, []);

    return (
        <AudioContext.Provider value={{ beatIntensity, triggerBeat }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within AudioProvider');
    }
    return context;
};
