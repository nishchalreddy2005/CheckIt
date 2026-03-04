"use client"

import { useEffect, useState, Suspense, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, X, RotateCcw, CheckCircle2, Music, Volume2, VolumeX, Clock, Link2, ChevronDown } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { FocusTimer3D } from "@/components/focus-timer-3d"
import { toggleTaskCompletion } from "@/app/actions/task-actions"
import { useToast } from "@/components/ui/use-toast"
import type { Task } from "@/lib/types"

// Custom local songs loaded into public/audio
const AMBIENT_TRACKS = [
    { name: "Classical Brain Power", url: "/audio/classical-brain-power.mp3" },
    { name: "40Hz Gamma Brainwaves", url: "/audio/gamma-brainwaves.mp3" },
    { name: "Interstellar Focus", url: "/audio/interstellar-focus.mp3" },
    { name: "Forest Rain Ambience", url: "/audio/forest-rain.mp3" },
    { name: "Relaxing Study Music", url: "/audio/relaxing-study-music.mp3" },
    { name: "Tibetan Singing Bowls", url: "/audio/tibetan-singing-bowls.mp3" },
    { name: "Alpha Waves Study", url: "/audio/alpha-waves-study.mp3" },
    { name: "Sunny Mornings Piano", url: "/audio/sunny-mornings-piano.mp3" },
]

const PRESET_DURATIONS = [
    { label: "15m", seconds: 15 * 60 },
    { label: "25m", seconds: 25 * 60 },
    { label: "45m", seconds: 45 * 60 },
    { label: "60m", seconds: 60 * 60 },
    { label: "90m", seconds: 90 * 60 },
]

export default function FocusPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [task, setTask] = useState<Task | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Timer state
    const [workDuration, setWorkDuration] = useState(25 * 60)
    const [breakDuration] = useState(5 * 60)
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<'setup' | 'work' | 'break'>('setup')

    // Custom time input
    const [customMinutes, setCustomMinutes] = useState("")

    // Time range input
    const [useTimeRange, setUseTimeRange] = useState(false)
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    // Music state
    const [showMusicPanel, setShowMusicPanel] = useState(false)
    const [currentTrack, setCurrentTrack] = useState<number | null>(null)
    const [customUrl, setCustomUrl] = useState("")
    const [embedUrl, setEmbedUrl] = useState<string | null>(null)
    const [volume, setVolume] = useState(0.5)
    const [isMuted, setIsMuted] = useState(false)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    // Fetch task on load
    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await fetch(`/api/tasks`)
                if (!res.ok) throw new Error("Failed to load task")
                const data = await res.json()
                const target = data.tasks.find((t: any) => t.id === params.id)
                if (target) {
                    setTask(target)
                } else {
                    router.push("/dashboard")
                }
            } catch (err) {
                toast({ title: "Error", description: "Couldn't load task. Returning to dashboard.", variant: "destructive" })
                router.push("/dashboard")
            } finally {
                setIsLoading(false)
            }
        }
        fetchTask()
    }, [params.id, router, toast])

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (isRunning && timeLeft === 0) {
            setIsRunning(false)

            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
            audio.play().catch(() => { })

            if (mode === 'work') {
                toast({ title: "Focus Session Complete!", description: "Time for a 5 minute break." })
                setMode('break')
                setTimeLeft(breakDuration)
            } else {
                toast({ title: "Break Complete!", description: "Ready for another flow session?" })
                setMode('setup')
                setTimeLeft(workDuration)
            }
        }

        return () => clearInterval(interval)
    }, [isRunning, timeLeft, mode, toast, workDuration, breakDuration])

    // Volume management
    useEffect(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.volume = isMuted ? 0 : volume
        }
    }, [volume, isMuted])

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause()
                audioPlayerRef.current.src = ""
            }
        }
    }, [])

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const selectPreset = (seconds: number) => {
        setWorkDuration(seconds)
        setTimeLeft(seconds)
        setCustomMinutes("")
        setUseTimeRange(false)
    }

    const applyCustomMinutes = () => {
        const mins = parseInt(customMinutes)
        if (mins > 0 && mins <= 300) {
            setWorkDuration(mins * 60)
            setTimeLeft(mins * 60)
            setUseTimeRange(false)
        }
    }

    const applyTimeRange = () => {
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(":").map(Number)
            const [eh, em] = endTime.split(":").map(Number)
            let startMins = sh * 60 + sm
            let endMins = eh * 60 + em
            if (endMins <= startMins) endMins += 24 * 60
            const durationSecs = (endMins - startMins) * 60
            if (durationSecs > 0) {
                setWorkDuration(durationSecs)
                setTimeLeft(durationSecs)
            }
        }
    }

    const startSession = () => {
        setMode('work')
        setIsRunning(true)
    }

    const toggleTimer = () => setIsRunning(!isRunning)

    const resetTimer = () => {
        setIsRunning(false)
        setTimeLeft(mode === 'work' ? workDuration : breakDuration)
    }

    // Synchronize native audio playing with timer state
    useEffect(() => {
        if (audioPlayerRef.current) {
            if (isRunning) {
                audioPlayerRef.current.play().catch(e => console.error("Error playing audio on resume:", e))
            } else {
                audioPlayerRef.current.pause()
            }
        }
    }, [isRunning])

    // Play ambient sound using custom MP3 tracks
    const playTrack = (index: number) => {
        setEmbedUrl(null)

        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
        }

        const trackUrl = AMBIENT_TRACKS[index].url
        const audio = new Audio(trackUrl)
        audio.loop = true
        audio.volume = isMuted ? 0 : volume

        if (isRunning) {
            audio.play().catch(e => console.error("Error playing custom audio:", e))
        } else {
            toast({ title: "Track Selected", description: "Audio will play when you start the focus timer." })
        }

        audioPlayerRef.current = audio
        setCurrentTrack(index)
    }

    const getEmbedUrl = (url: string): string | null => {
        // YouTube
        let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&loop=1`

        // YouTube playlist
        match = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/)
        if (match) return `https://www.youtube.com/embed/videoseries?list=${match[1]}&autoplay=1`

        // Spotify track
        match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
        if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`

        return null
    }

    const playCustomUrl = () => {
        if (!customUrl.trim()) return
        // Stop native audio player
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
        }
        setCurrentTrack(-1)

        const embed = getEmbedUrl(customUrl)
        if (embed) {
            setEmbedUrl(embed)
            if (isRunning) {
                toast({ title: "Music Playing", description: "Embedded player loaded." })
            } else {
                toast({ title: "Link Loaded", description: "Audio will play when you start the focus timer." })
            }
        } else {
            toast({ title: "Unsupported Link", description: "Please paste a YouTube or Spotify URL.", variant: "destructive" })
        }
    }

    const stopMusic = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            audioPlayerRef.current.src = ""
        }
        setEmbedUrl(null)
        setCurrentTrack(null)
    }

    const handleCompleteTask = async () => {
        if (!task) return
        setIsRunning(false)
        stopMusic()
        const fd = new FormData()
        fd.append("id", task.id)

        try {
            await toggleTaskCompletion(fd)
            toast({
                title: "Task Done!",
                description: `You crushed "${task.title}".`,
            })
            setTimeout(() => router.push("/dashboard"), 1500)
        } catch (e) {
            toast({ title: "Error", description: "Could not complete task.", variant: "destructive" })
        }
    }

    const exitFocus = () => {
        stopMusic()
        router.push("/dashboard")
    }

    const progress = mode === 'work'
        ? 1 - (timeLeft / workDuration)
        : mode === 'break'
            ? 1 - (timeLeft / breakDuration)
            : 0

    if (isLoading) return <div className="min-h-screen bg-[#030014] flex items-center justify-center text-white font-bold animate-pulse">Entering Flow State...</div>
    if (!task) return null

    return (
        <div className="relative min-h-screen bg-[#030014] text-white overflow-hidden flex flex-col items-center justify-center">
            {/* Absolute fullscreen 3D Canvas Background */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={null}>
                    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                        <FocusTimer3D isRunning={isRunning} progress={progress} mode={mode === 'break' ? 'break' : 'work'} />
                    </Canvas>
                </Suspense>
            </div>

            {/* Radial fade */}
            <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#030014_80%)] opacity-90" />

            {/* UI Overlay */}
            <div className="relative z-20 w-full max-w-2xl px-6 flex flex-col items-center">

                {/* Top bar */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                    <Button variant="ghost" className="text-white/50 hover:text-white" onClick={exitFocus}>
                        <X className="w-6 h-6 mr-2" /> End Session
                    </Button>
                    <div className="flex items-center gap-3">
                        {mode !== 'setup' && (
                            <div className={`px-4 py-1.5 rounded-full border backdrop-blur-md text-sm font-semibold tracking-wider uppercase transition-colors
                                ${mode === 'work' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}
                            `}>
                                {mode === 'work' ? 'Deep Work' : 'Resting'}
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/50 hover:text-white h-10 w-10"
                            onClick={() => setShowMusicPanel(!showMusicPanel)}
                        >
                            <Music className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Music Panel */}
                {showMusicPanel && (
                    <div className="absolute top-20 right-6 glass-card p-5 rounded-2xl w-[300px] z-30 border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-white/90">🎵 Focus Music</h3>
                            {currentTrack !== null && (
                                <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300 h-7" onClick={stopMusic}>
                                    Stop
                                </Button>
                            )}
                        </div>

                        {/* Ambient Tracks */}
                        <div className="space-y-1.5">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Ambient Sounds</p>
                            {AMBIENT_TRACKS.map((track, i) => (
                                <button
                                    key={i}
                                    onClick={() => playTrack(i)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${currentTrack === i
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'text-white/70 hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    {currentTrack === i ? '♫ ' : '  '}{track.name}
                                </button>
                            ))}
                        </div>

                        {/* Custom URL */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Paste Link</p>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="YouTube or Spotify URL..."
                                    className="glass-input text-xs h-9 flex-1"
                                />
                                <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-500" onClick={playCustomUrl}>
                                    <Link2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-white/30">Plays directly within CheckIt</p>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white">
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="flex-1 accent-indigo-500 h-1"
                            />
                        </div>
                    </div>
                )}

                {/* Embedded YouTube/Spotify Player — lives OUTSIDE the panel so it persists when panel closes */}
                {embedUrl && (
                    <div className="fixed bottom-4 left-4 z-50 glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Now Playing</span>
                            <button onClick={stopMusic} className="text-[10px] text-red-400 hover:text-red-300">✕ Stop</button>
                        </div>
                        {isRunning ? (
                            <iframe
                                src={embedUrl}
                                width="300"
                                height={embedUrl.includes("spotify") ? "80" : "60"}
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex items-center justify-center bg-black/50 text-xs text-white/50 w-[300px]" style={{ height: embedUrl.includes("spotify") ? "80px" : "60px" }}>
                                Waiting for timer to start...
                            </div>
                        )}
                    </div>
                )}

                {/* Setup Screen */}
                {mode === 'setup' && (
                    <div className="flex flex-col items-center mt-20 mb-12 w-full max-w-md space-y-8">
                        <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Configure Focus</h1>
                        <p className="text-white/50 text-center">{task.title}</p>

                        {/* Preset Durations */}
                        <div className="space-y-3 w-full">
                            <p className="text-xs text-white/40 uppercase tracking-wider text-center">Duration</p>
                            <div className="flex gap-2 justify-center flex-wrap">
                                {PRESET_DURATIONS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => selectPreset(preset.seconds)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${workDuration === preset.seconds
                                            ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Duration */}
                        <div className="space-y-2 w-full">
                            <p className="text-xs text-white/40 uppercase tracking-wider text-center">Custom (minutes)</p>
                            <div className="flex gap-2 justify-center">
                                <Input
                                    type="number"
                                    min="1"
                                    max="300"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    placeholder="e.g. 35"
                                    className="glass-input w-28 text-center"
                                />
                                <Button onClick={applyCustomMinutes} className="bg-indigo-600 hover:bg-indigo-500">Set</Button>
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="space-y-3 w-full">
                            <button
                                onClick={() => setUseTimeRange(!useTimeRange)}
                                className="flex items-center gap-2 mx-auto text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                Schedule Time Range
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${useTimeRange ? 'rotate-180' : ''}`} />
                            </button>
                            {useTimeRange && (
                                <div className="flex gap-3 items-center justify-center">
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="glass-input w-32 text-center"
                                    />
                                    <span className="text-white/40">to</span>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="glass-input w-32 text-center"
                                    />
                                    <Button onClick={applyTimeRange} size="sm" className="bg-indigo-600 hover:bg-indigo-500">Apply</Button>
                                </div>
                            )}
                        </div>

                        {/* Selected duration display */}
                        <div className="text-center">
                            <div className="text-6xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={startSession}
                            className="w-full max-w-xs h-14 bg-indigo-600 hover:bg-indigo-500 text-lg font-bold rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-indigo-500/50"
                        >
                            <Play className="w-6 h-6 mr-2" /> Start Focus Session
                        </Button>
                    </div>
                )}

                {/* Active Timer Screen */}
                {mode !== 'setup' && (
                    <>
                        {/* Central Timer */}
                        <div className="flex flex-col items-center mt-20 mb-12">
                            <h1 className="text-8xl md:text-9xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                {formatTime(timeLeft)}
                            </h1>
                            <p className="mt-6 text-xl text-white/70 max-w-md text-center font-medium leading-relaxed">
                                {task.title}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6 mt-12 bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-14 h-14 rounded-full text-white/50 hover:text-white hover:bg-white/10"
                                onClick={resetTimer}
                            >
                                <RotateCcw className="w-6 h-6" />
                            </Button>

                            <Button
                                onClick={toggleTimer}
                                className={`w-20 h-20 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-none transition-all duration-300 hover:scale-105 active:scale-95
                                    ${isRunning
                                        ? 'bg-red-500/80 hover:bg-red-500 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }
                                `}
                            >
                                {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-14 h-14 rounded-full text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-400/10"
                                onClick={handleCompleteTask}
                            >
                                <CheckCircle2 className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Task description */}
                        {task.description && (
                            <div className="mt-16 glass-panel p-6 rounded-2xl max-w-lg w-full text-center border-white/5 bg-white/5">
                                <p className="text-sm text-white/50">{task.description}</p>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    )
}
