import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrainCircuit, Camera, CameraOff, Clock3, Mic, MicOff, Send, Target, Volume2, VolumeX } from "lucide-react";
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

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => {
      const firstQuestion = data.questions[0]?.prompt || "Tell me about yourself and why this role is a strong fit for you.";
      const opening = data.interview.interviewPlan?.openingMessage || "Welcome. I will conduct this like a real live interview and adapt based on your answers.";
      const savedTranscript = data.interview.transcript || [];
      const initialMessages = savedTranscript.length > 1
        ? savedTranscript.map((item) => ({ speaker: item.speaker, text: item.text }))
        : [
            { speaker: "interviewer", text: opening },
            { speaker: "interviewer", text: firstQuestion, meta: "Question 1" }
          ];

      setSession(data);
      setMessages(initialMessages);
      setCurrentQuestion(initialMessages.at(-1)?.speaker === "interviewer" ? initialMessages.at(-1).text : firstQuestion);
      setTurn(data.feedback?.length || 0);
      if (voiceEnabled) {
        window.setTimeout(() => speakInterviewer(initialMessages.map((item) => item.text).join(" ")), 400);
      }
    });
  }, [id, voiceEnabled]);

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

  const progress = useMemo(() => Math.min(100, Math.round((turn / maxTurns) * 100)), [turn]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");

  if (!session) return <Spinner />;

  const speakInterviewer = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

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

  const toggleCamera = async () => {
    if (cameraEnabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraEnabled(false);
      return;
    }

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
    <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
      <section className="panel flex min-h-[72vh] flex-col p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-night ${speaking ? "shadow-[0_0_34px_rgba(92,225,230,0.55)]" : ""}`}>
              <BrainCircuit size={24} />
              <span className={`absolute bottom-2 h-1.5 rounded-full bg-night transition-all ${speaking ? "w-7 animate-pulse" : "w-4"}`} />
            </div>
            <div>
              <p className="text-sm text-cyan">Live AI interviewer</p>
              <h2 className="text-xl font-semibold">{session.interview.role}</h2>
              <p className="mt-1 text-xs text-slate-500">{speaking ? "Speaking now" : listening ? "Listening to your answer" : "Ready"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary px-3" onClick={() => setVoiceEnabled((value) => !value)} aria-label="Toggle AI voice">
              {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button className={`btn-secondary px-3 ${listening ? "border-coral text-coral" : ""}`} onClick={toggleListening} aria-label="Toggle voice recognition">
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button className="btn-secondary px-3" onClick={toggleCamera} aria-label="Toggle camera">
              {cameraEnabled ? <CameraOff size={17} /> : <Camera size={17} />}
            </button>
            <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm">
              <Clock3 size={16} className={seconds < 20 ? "text-coral" : "text-cyan"} /> {minutes}:{rest}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => {
            const isCandidate = message.speaker === "candidate";
            return (
              <motion.div
                key={`${message.text}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[86%] rounded-lg px-4 py-3 ${isCandidate ? "bg-cyan text-night" : "border border-white/10 bg-white/[0.05] text-slate-100"}`}>
                  {message.meta && <p className={`mb-2 text-xs ${isCandidate ? "text-night/70" : "text-slate-500"}`}>{message.meta}</p>}
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                </div>
              </motion.div>
            );
          })}
          {submitting && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-400">Interviewer is listening and preparing the next question...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/10 p-5">
          <label className="sr-only" htmlFor="live-answer">Your answer</label>
          <div className="flex gap-3">
            <textarea
              id="live-answer"
              className="field min-h-24 resize-none leading-6"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
              }}
              placeholder="Speak like you are in a real interview. Explain your thinking, tradeoffs, and examples..."
            />
            <button onClick={submit} className="btn-primary h-24 w-16 shrink-0 px-0" disabled={submitting || answer.trim().length < 8} aria-label="Send answer">
              <Send size={20} />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="panel">
          <h3 className="flex items-center gap-2 font-semibold"><Camera size={17} className="text-cyan" /> Candidate camera</h3>
          <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            {cameraEnabled ? (
              <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">Camera preview off</div>
            )}
          </div>
          {cameraError && <p className="mt-3 text-xs text-coral">{cameraError}</p>}
          <button className="btn-secondary mt-4 w-full" onClick={toggleCamera}>
            {cameraEnabled ? <CameraOff size={17} /> : <Camera size={17} />} {cameraEnabled ? "Turn camera off" : "Turn camera on"}
          </button>
        </div>

        <div className="panel">
          <h3 className="flex items-center gap-2 font-semibold"><Mic size={17} className="text-cyan" /> Voice interview</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">The AI speaks questions aloud. Use the mic button to dictate your answer, then send it for evaluation.</p>
          <button className={`btn-primary mt-4 w-full ${listening ? "bg-coral" : ""}`} onClick={toggleListening}>
            {listening ? <MicOff size={17} /> : <Mic size={17} />} {listening ? "Stop listening" : "Start speaking"}
          </button>
          <div className="mt-5 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-cyan" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-sm text-slate-500">{turn} of {maxTurns} answers completed</p>
        </div>

        <div className="panel">
          <h3 className="flex items-center gap-2 font-semibold"><Target size={17} className="text-cyan" /> What AI is judging</h3>
          <div className="mt-4 space-y-2">
            {(session.interview.interviewPlan?.competencies || []).map((item) => (
              <div key={item.name} className="rounded-md bg-white/[0.04] p-3">
                <div className="flex justify-between gap-2 text-sm"><span>{item.name}</span><span className="text-cyan">{item.weight}%</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.whyItMatters}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
