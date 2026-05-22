import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrainCircuit, Camera, CameraOff, Clock3, Mic, MicOff, Radio, Send, Sparkles, Target, UserRound, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/client";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const maxTurns = 6;

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [turn, setTurn] = useState(0);
  const [seconds, setSeconds] = useState(150);
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const endRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const speakInterviewer = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => {
      const firstQuestion = data.questions[0]?.prompt || "Tell me about yourself and why this role is a strong fit for you.";
      const opening = `Hi, I am your HireSense AI interviewer. I will conduct this like a real mock interview. I will ask short questions, listen to your answer, and adapt the next question based on your response. Let us start with a short introduction.`;
      const savedTranscript = data.interview.transcript || [];
      const initialMessages = savedTranscript.length > 1
        ? savedTranscript.map((item) => ({ speaker: item.speaker, text: item.text }))
        : [
            { speaker: "interviewer", text: opening },
            { speaker: "interviewer", text: `First, please introduce yourself briefly and tell me which role you are targeting.`, meta: "Question 1" }
          ];

      setSession(data);
      setMessages(initialMessages);
      setCurrentQuestion(initialMessages.at(-1)?.speaker === "interviewer" ? initialMessages.at(-1).text : firstQuestion);
      setTurn(data.feedback?.length || 0);
      if (voiceEnabled) {
        const spokenIntro = savedTranscript.length > 1 ? initialMessages.at(-1)?.text : `${opening} First, please introduce yourself briefly and tell me which role you are targeting.`;
        window.setTimeout(() => speakInterviewer(spokenIntro), 600);
      }
    });
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSeconds(150);
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraEnabled]);

  useEffect(() => {
    if (!session || cameraEnabled || streamRef.current) return;
    startCamera();
  }, [session, cameraEnabled]);

  const progress = useMemo(() => Math.min(100, Math.round((turn / maxTurns) * 100)), [turn]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");

  if (!session) return <Spinner />;

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify("Speech recognition works best in Chrome or Edge", "error");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) setAnswer((value) => `${value}${value ? " " : ""}${finalText.trim()}`);
      if (interimText) setAnswer((value) => value.replace(/\s*\[listening:[^\]]*\]$/, "") + ` [listening: ${interimText.trim()}]`);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
      setCameraError("");
    } catch {
      setCameraError("Camera permission was blocked or no camera was found.");
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraEnabled(false);
      return;
    }

    await startCamera();
  };

  const submit = async () => {
    const trimmed = answer.replace(/\s*\[listening:[^\]]*\]$/, "").trim();
    if (trimmed.length < 8) return;
    setSubmitting(true);
    setMessages((items) => [...items, { speaker: "candidate", text: trimmed }]);

    try {
      const { data } = await api.post(`/interviews/${id}/live-answer`, {
        answer: trimmed,
        currentQuestion
      });

      const nextTurn = turn + 1;
      setTurn(nextTurn);
      setAnswer("");

      const nextMessages = [{ speaker: "interviewer", text: data.interviewerReply || "Thank you. Let me continue from there.", meta: `Score ${data.feedback.score}%` }];
      if (data.completed) {
        nextMessages.push({ speaker: "interviewer", text: "That completes the interview. I am preparing your readiness report now." });
        setMessages((items) => [...items, ...nextMessages]);
        speakInterviewer(nextMessages.map((item) => item.text).join(" "));
        window.setTimeout(() => navigate(`/interview/${id}/complete`), 800);
        return;
      }

      nextMessages.push({
        speaker: "interviewer",
        text: data.nextQuestion || "Let us go deeper. Can you explain your reasoning with a real example?",
        meta: `Question ${nextTurn + 1} · ${data.nextQuestionCategory || "adaptive"}`
      });
      setCurrentQuestion(nextMessages.at(-1).text);
      setMessages((items) => [...items, ...nextMessages]);
      speakInterviewer(nextMessages.map((item) => item.text).join(" "));
    } catch (error) {
      notify(error.response?.data?.message || "Live interviewer could not respond", "error");
      setMessages((items) => items.filter((item) => item.text !== trimmed));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#070B16] shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan">
              <Radio size={16} className={speaking || listening ? "animate-pulse" : ""} />
              Live interview session
            </div>
            <h2 className="mt-1 text-2xl font-semibold">{session.interview.role}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-night/60 px-3 py-2 text-sm">
              <Clock3 size={16} className={seconds < 20 ? "text-coral" : "text-cyan"} /> {minutes}:{rest}
            </div>
            <div className="rounded-md border border-white/10 bg-night/60 px-3 py-2 text-sm text-slate-300">{turn}/{maxTurns} answered</div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[330px] overflow-hidden rounded-lg border border-cyan/20 bg-[radial-gradient(circle_at_50%_30%,rgba(92,225,230,0.22),transparent_34%),linear-gradient(135deg,#10182A,#070914)] p-5">
            <div className="absolute right-4 top-4 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs text-cyan">
              {speaking ? "Speaking" : "AI interviewer"}
            </div>
            <div className="flex h-full min-h-[290px] flex-col items-center justify-center text-center">
              <motion.div
                animate={speaking ? { scale: [1, 1.04, 1], boxShadow: ["0 0 30px rgba(92,225,230,0.25)", "0 0 80px rgba(92,225,230,0.5)", "0 0 30px rgba(92,225,230,0.25)"] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: speaking ? Infinity : 0 }}
                className="relative flex h-36 w-36 items-center justify-center rounded-full border border-cyan/30 bg-cyan text-night"
              >
                <BrainCircuit size={58} />
                <span className={`absolute bottom-9 h-2 rounded-full bg-night transition-all ${speaking ? "w-16" : "w-9"}`} />
              </motion.div>
              <h3 className="mt-6 text-3xl font-semibold">HireSense Interviewer</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                {speaking ? "Asking the next question out loud." : listening ? "Listening while you answer." : "Ready to evaluate your response and adapt the next question."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {(session.interview.interviewPlan?.competencies || []).slice(0, 4).map((item) => (
                  <span key={item.name} className="rounded-full border border-white/10 bg-night/50 px-3 py-1 text-xs text-slate-300">{item.name}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[330px] overflow-hidden rounded-lg border border-white/10 bg-[#0B1020]">
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-night/70 px-3 py-1 text-xs text-slate-300">
              Candidate camera
            </div>
            {cameraEnabled ? (
              <video ref={videoRef} className="h-full min-h-[330px] w-full object-cover" autoPlay muted playsInline />
            ) : (
              <div className="flex min-h-[330px] flex-col items-center justify-center bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                  <UserRound className="text-slate-500" size={42} />
                </div>
                <p className="mt-5 font-medium text-slate-200">Camera preview is off</p>
                <p className="mt-2 max-w-xs text-sm text-slate-500">Turn it on for a real video-interview demo experience.</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-night/80 p-3 backdrop-blur-xl">
              <div className="text-sm">
                <p className="font-medium">You</p>
                <p className="text-xs text-slate-500">{listening ? "Mic listening" : cameraEnabled ? "Camera active" : "Preview mode"}</p>
              </div>
              <button className="btn-secondary px-3" onClick={toggleCamera}>
                {cameraEnabled ? <CameraOff size={17} /> : <Camera size={17} />}
              </button>
            </div>
          </div>
        </div>

        {cameraError && <p className="px-5 pb-4 text-sm text-coral">{cameraError}</p>}

        <div className="grid gap-4 border-t border-white/10 bg-white/[0.02] p-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button className={`btn-secondary justify-center ${voiceEnabled ? "border-cyan/40 text-cyan" : ""}`} onClick={() => setVoiceEnabled((value) => !value)}>
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} AI voice
            </button>
            <button className="btn-secondary justify-center" onClick={() => speakInterviewer(messages.filter((item) => item.speaker === "interviewer").slice(-2).map((item) => item.text).join(" "))}>
              <Volume2 size={18} /> Replay intro
            </button>
            <button className={`btn-secondary justify-center ${listening ? "border-coral text-coral" : ""}`} onClick={toggleListening}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />} {listening ? "Listening" : "Mic answer"}
            </button>
            <button className={`btn-secondary justify-center ${cameraEnabled ? "border-lime/50 text-lime" : ""}`} onClick={toggleCamera}>
              {cameraEnabled ? <CameraOff size={18} /> : <Camera size={18} />} Camera
            </button>
          </div>
          <div className="min-w-56">
            <div className="h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-cyan" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-right text-xs text-slate-500">Interview progress {progress}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.36fr]">
        <div className="panel p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-xl font-semibold">Live transcript</h3>
              <p className="mt-1 text-sm text-slate-500">Human-style interview flow with adaptive follow-up questions.</p>
            </div>
            <Sparkles className="text-cyan" size={22} />
          </div>
          <div className="max-h-[420px] space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => {
              const isCandidate = message.speaker === "candidate";
              return (
                <motion.div
                  key={`${message.text}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] rounded-lg px-4 py-3 shadow-lg ${isCandidate ? "bg-cyan text-night" : "border border-white/10 bg-white/[0.055] text-slate-100"}`}>
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <span className={isCandidate ? "text-night/70" : "text-cyan"}>{isCandidate ? "You" : "AI interviewer"}</span>
                      {message.meta && <span className={isCandidate ? "text-night/60" : "text-slate-500"}>{message.meta.replace("Â·", "-")}</span>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                  </div>
                </motion.div>
              );
            })}
            {submitting && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-400">Interviewer is evaluating and preparing the next question...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 p-5">
            <label className="sr-only" htmlFor="live-answer">Your answer</label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                id="live-answer"
                className="field min-h-28 resize-none leading-6"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
                }}
                placeholder="Answer naturally. Mention context, your exact action, tradeoffs, and result..."
              />
              <button onClick={submit} className="btn-primary min-h-28 px-6" disabled={submitting || answer.trim().length < 8} aria-label="Send answer">
                <Send size={20} /> Send
              </button>
            </div>
          </div>
        </div>

        <aside className="panel h-fit">
          <h3 className="flex items-center gap-2 font-semibold"><Target size={17} className="text-cyan" /> Evaluation focus</h3>
          <div className="mt-4 space-y-3">
            {(session.interview.interviewPlan?.competencies || []).map((item) => (
              <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <div className="flex justify-between gap-2 text-sm"><span>{item.name}</span><span className="text-cyan">{item.weight}%</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.whyItMatters}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
