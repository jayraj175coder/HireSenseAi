import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrainCircuit, Camera, CameraOff, Clock3, Mic, MicOff, Radio, Send, Sparkles, Target, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/client";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import { interviewers } from "../data/interviewers";
import { buildGreetingMessages } from "../utils/interviewGreeting";

const maxTurns = 6;
const SILENCE_SUBMIT_MS = 3500;
const MIN_SPOKEN_ANSWER_CHARS = 8;

function questionMeta(question, index) {
  if (!question) return `Question ${index + 1}`;
  const parts = [`Question ${index + 1}`];
  if (question.category) parts.push(question.category.replace(/_/g, " "));
  if (question.source) parts.push(question.source);
  return parts.join(" · ");
}

function buildFreshSession(data) {
  const greeting = buildGreetingMessages(data.interview, data.interview.resume?.analysis || data.resume?.analysis);
  return {
    initialMessages: greeting.messages,
    currentQuestion: greeting.introPrompt,
    currentQuestionId: null,
    greetingSpeech: greeting.messages.map((item) => item.text)
  };
}

function matchQuestion(questions, questionId) {
  if (!questionId) return null;
  const id = questionId.toString();
  return questions.find((item) => item._id?.toString() === id) || null;
}

function mapTranscriptMessages(transcript, questions) {
  return transcript.map((item) => {
    const matched = matchQuestion(questions, item.question);
    const index = matched ? questions.findIndex((q) => q._id?.toString() === matched._id?.toString()) : -1;
    return {
      speaker: item.speaker,
      text: item.text,
      meta: matched ? questionMeta(matched, index) : undefined,
      questionId: item.question || matched?._id || null
    };
  });
}

function buildResumedSession(data) {
  const questions = data.questions || [];
  const turnIndex = data.feedback?.length || 0;
  const transcript = data.interview.transcript || [];
  const initialMessages = mapTranscriptMessages(transcript, questions);
  const activeQuestion = turnIndex === 0 ? null : questions[turnIndex - 1];
  const lastInterviewer = [...transcript].reverse().find((item) => item.speaker === "interviewer");

  return {
    initialMessages,
    currentQuestion: activeQuestion?.prompt || lastInterviewer?.text || "",
    currentQuestionId: activeQuestion?._id || lastInterviewer?.question || null
  };
}

function buildFromPersistedTranscript(data) {
  const turnIndex = data.feedback?.length || 0;
  if (turnIndex > 0) return buildResumedSession(data);

  const greeting = buildGreetingMessages(data.interview, data.interview.resume?.analysis || data.resume?.analysis);
  return {
    initialMessages: greeting.messages,
    currentQuestion: greeting.introPrompt,
    currentQuestionId: null,
    greetingSpeech: greeting.messages.map((item) => item.text)
  };
}

const metricLabels = [
  ["communication", "Communication"],
  ["technical", "Technical depth"],
  ["confidence", "Confidence"],
  ["problemSolving", "Problem solving"]
];

function Waveform({ active }) {
  return (
    <div className="flex h-9 items-end justify-center gap-1">
      {[8, 18, 28, 16, 34, 22, 12].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-1.5 rounded-full bg-cyan ${active ? "animate-pulse" : "opacity-40"}`}
          style={{ height: active ? `${height}px` : "8px", animationDelay: `${index * 90}ms` }}
        />
      ))}
    </div>
  );
}

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [answer, setAnswer] = useState("");
  const [turn, setTurn] = useState(0);
  const [seconds, setSeconds] = useState(150);
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [difficultyStage, setDifficultyStage] = useState("Beginner");
  const [autoSendPending, setAutoSendPending] = useState(false);
  const [autoVoiceMode, setAutoVoiceMode] = useState(true);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const listenIntentRef = useRef(true);
  const submittingRef = useRef(false);
  const speakingRef = useRef(false);
  const answerRef = useRef("");
  const sessionRef = useRef(null);
  const turnRef = useRef(0);
  const currentQuestionRef = useRef("");
  const currentQuestionIdRef = useRef(null);
  const tryAutoListenRef = useRef(() => {});

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    currentQuestionIdRef.current = currentQuestionId;
  }, [currentQuestionId]);

  const cleanAnswerText = useCallback((value) => value.replace(/\s*\[listening:[^\]]*\]$/, "").trim(), []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setAutoSendPending(false);
  }, []);

  const stopListening = useCallback(() => {
    listenIntentRef.current = false;
    recognitionRef.current?.stop?.();
    setListening(false);
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  const speakInterviewer = useCallback((text, onDone) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    utterance.onstart = () => {
      speakingRef.current = true;
      setSpeaking(true);
      stopListening();
    };
    utterance.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);
      onDone?.();
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
      onDone?.();
    };
    window.speechSynthesis.speak(utterance);
  }, [stopListening, voiceEnabled]);

  const speakGreetingSequence = useCallback((parts = [], onDone) => {
    if (!parts.length) {
      onDone?.();
      return;
    }
    const [head, ...rest] = parts;
    speakInterviewer(head, () => {
      if (rest.length) speakGreetingSequence(rest, onDone);
      else onDone?.();
    });
  }, [speakInterviewer]);

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => {
      const turnIndex = data.feedback?.length || 0;
      const savedTranscript = data.interview.transcript || [];
      const hasCandidateTurns = savedTranscript.some((item) => item.speaker === "candidate");
      const hasPersistedBankQuestion = savedTranscript.some((item) => item.speaker === "interviewer" && item.question);
      const sessionState = hasCandidateTurns || turnIndex > 0
        ? buildResumedSession(data)
        : hasPersistedBankQuestion
          ? buildFromPersistedTranscript(data)
          : buildFreshSession(data);

      setSession(data);
      setMessages(sessionState.initialMessages);
      setCurrentQuestion(sessionState.currentQuestion);
      setCurrentQuestionId(sessionState.currentQuestionId);
      setTurn(data.feedback?.length || 0);
      setLatestFeedback(data.feedback?.at(-1) || null);
      setDifficultyStage(data.interview.difficultyStage || "Beginner");
      sessionRef.current = data;
      const startMicAfterSpeech = () => {
        window.setTimeout(() => tryAutoListenRef.current(), 500);
      };
      if (voiceEnabled) {
        window.setTimeout(() => {
          if (sessionState.greetingSpeech?.length) speakGreetingSequence(sessionState.greetingSpeech, startMicAfterSpeech);
          else speakInterviewer(sessionState.currentQuestion, startMicAfterSpeech);
        }, 600);
      } else {
        startMicAfterSpeech();
      }
    });
  }, [id, speakGreetingSequence, speakInterviewer, voiceEnabled]);

  // useEffect(() => {
  //   endRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  useEffect(() => {
    setSeconds(150);
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraEnabled]);

  useEffect(() => {
    if (!session || streamRef.current) return;
    startCamera();
  }, [session]);

  const submitAnswer = useCallback(async () => {
    const activeSession = sessionRef.current;
    if (!activeSession || submittingRef.current) return;

    const trimmed = cleanAnswerText(answerRef.current);
    if (trimmed.length < MIN_SPOKEN_ANSWER_CHARS) return;

    submittingRef.current = true;
    stopListening();
    setSubmitting(true);
    setMessages((items) => [...items, { speaker: "candidate", text: trimmed }]);

    try {
      const currentTurn = turnRef.current;
      const bankQuestion = currentTurn === 0 ? null : activeSession.questions?.[currentTurn - 1];

      const { data } = await api.post(`/interviews/${id}/live-answer`, {
        answer: trimmed,
        currentQuestion: bankQuestion?.prompt || currentQuestionRef.current,
        questionId: currentTurn === 0 ? undefined : currentQuestionIdRef.current || bankQuestion?._id
      });

      const nextTurn = currentTurn + 1;
      setTurn(nextTurn);
      setLatestFeedback(data.feedback);
      setDifficultyStage(data.difficultyStage || data.interview?.difficultyStage || difficultyStage);
      setAnswer("");

      const nextMessages = [{ speaker: "interviewer", text: data.interviewerReply || "Thank you. Let me continue from there.", meta: `Score ${data.feedback.score}%` }];
      if (data.completed) {
        nextMessages.push({ speaker: "interviewer", text: "That completes the interview. I am preparing your readiness report now." });
        setMessages((items) => [...items, ...nextMessages]);
        speakInterviewer(nextMessages.map((item) => item.text).join(" "), () => {});
        window.setTimeout(() => navigate(`/interview/${id}/complete`), 800);
        return;
      }

      const nextBankQuestion = nextTurn > 0 ? activeSession.questions?.[nextTurn - 1] : null;
      const nextPrompt = data.nextQuestion || nextBankQuestion?.prompt || "Let us go deeper. Can you explain your reasoning with a real example?";
      nextMessages.push({
        speaker: "interviewer",
        text: nextPrompt,
        meta: nextBankQuestion
          ? questionMeta(nextBankQuestion, nextTurn - 1)
          : `Question ${nextTurn + 1} · ${data.nextQuestionCategory || "adaptive"}`,
        questionId: data.nextQuestionId || nextBankQuestion?._id || null
      });
      setCurrentQuestion(nextPrompt);
      setCurrentQuestionId(data.nextQuestionId || nextBankQuestion?._id || null);
      setMessages((items) => [...items, ...nextMessages]);

      const spokenReply = `${data.interviewerReply || "Thank you."} ${nextPrompt}`;
      speakInterviewer(spokenReply, () => {
        if (autoVoiceMode) tryAutoListenRef.current();
      });
    } catch (error) {
      notify(error.response?.data?.message || "Live interviewer could not respond", "error");
      setMessages((items) => items.filter((item) => item.text !== trimmed));
      if (autoVoiceMode) tryAutoListenRef.current();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [autoVoiceMode, cleanAnswerText, difficultyStage, id, navigate, notify, speakInterviewer, stopListening]);

  const scheduleSilenceSubmit = useCallback(() => {
    if (!autoVoiceMode || submittingRef.current || speakingRef.current) return;
    clearSilenceTimer();
    const trimmed = cleanAnswerText(answerRef.current);
    if (trimmed.length < MIN_SPOKEN_ANSWER_CHARS) return;

    setAutoSendPending(true);
    silenceTimerRef.current = window.setTimeout(() => {
      silenceTimerRef.current = null;
      setAutoSendPending(false);
      submitAnswer();
    }, SILENCE_SUBMIT_MS);
  }, [autoVoiceMode, cleanAnswerText, clearSilenceTimer, submitAnswer]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify("Speech recognition works best in Chrome or Edge", "error");
      return;
    }
    if (listening || submittingRef.current || speakingRef.current) return;

    listenIntentRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onerror = () => {
      setListening(false);
      if (listenIntentRef.current && autoVoiceMode && !submittingRef.current && !speakingRef.current) {
        window.setTimeout(() => tryAutoListenRef.current(), 600);
      }
    };
    recognition.onend = () => {
      setListening(false);
      scheduleSilenceSubmit();
      if (listenIntentRef.current && autoVoiceMode && !submittingRef.current && !speakingRef.current) {
        window.setTimeout(() => tryAutoListenRef.current(), 400);
      }
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) {
        setAnswer((value) => {
          const base = value.replace(/\s*\[listening:[^\]]*\]$/, "").trim();
          const next = `${base}${base ? " " : ""}${finalText.trim()}`;
          answerRef.current = next;
          return next;
        });
        scheduleSilenceSubmit();
      }
      if (interimText) {
        setAnswer((value) => {
          const next = `${value.replace(/\s*\[listening:[^\]]*\]$/, "").trim()} [listening: ${interimText.trim()}]`;
          answerRef.current = next;
          return next;
        });
        clearSilenceTimer();
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [autoVoiceMode, clearSilenceTimer, listening, notify, scheduleSilenceSubmit]);

  const tryAutoStartListening = useCallback(() => {
    if (!autoVoiceMode || !sessionRef.current || submittingRef.current || speakingRef.current) return;
    listenIntentRef.current = true;
    startListening();
  }, [autoVoiceMode, startListening]);

  useEffect(() => {
    tryAutoListenRef.current = tryAutoStartListening;
  }, [tryAutoStartListening]);

  const submit = () => {
    clearSilenceTimer();
    submitAnswer();
  };

  const progress = useMemo(() => Math.min(100, Math.round((turn / maxTurns) * 100)), [turn]);
  const selectedInterviewer = useMemo(
    () => interviewers.find((item) => item.id === session?.interview?.interviewerStyle) || interviewers[0],
    [session?.interview?.interviewerStyle]
  );
  const liveMetrics = useMemo(() => {
    const signals = latestFeedback?.communicationSignals || {};
    const rubric = latestFeedback?.rubricScores || [];
    const technical = rubric.find((item) => /role|technical|depth|correctness/i.test(item.criterion))?.score || latestFeedback?.score || 54;
    const problemSolving = rubric.find((item) => /structure|tradeoff|problem/i.test(item.criterion))?.score || Math.max(45, (latestFeedback?.score || 55) - 4);
    return {
      communication: signals.clarity || 50 + turn * 5,
      technical,
      confidence: latestFeedback?.confidence || 45 + turn * 6,
      problemSolving
    };
  }, [latestFeedback, turn]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");

  if (!session) return <Spinner />;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
      setCameraError("");
    } catch {
      setCameraEnabled(false);
      setCameraError("Camera permission was blocked or no camera was found.");
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
              {speaking ? "Speaking" : selectedInterviewer.name}
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
              <div className="mt-3">
                <Waveform active={speaking} />
              </div>
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
            <video
              ref={videoRef}
              className={`h-full min-h-[330px] w-full object-cover ${cameraEnabled ? "" : "opacity-0"}`}
              autoPlay
              muted
              playsInline
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex min-h-[330px] flex-col items-center justify-center bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 text-center">
                <p className="font-medium text-slate-200">{cameraError || "Starting camera..."}</p>
                {cameraError && (
                  <button className="btn-secondary mt-4" onClick={startCamera}>
                    <Camera size={17} /> Allow camera
                  </button>
                )}
              </div>
            )}
            <div className={`absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-night/80 p-3 backdrop-blur-xl ${listening ? "border-coral/50 shadow-[0_0_36px_rgba(255,122,107,0.18)]" : "border-white/10"}`}>
              <div className="text-sm">
                <p className="font-medium">You</p>
                <p className="text-xs text-slate-500">
                  {listening
                    ? autoSendPending
                      ? "Pause detected — sending soon..."
                      : autoVoiceMode
                        ? "Mic on · auto-send after pause"
                        : "Mic listening"
                    : cameraEnabled
                      ? "Camera on"
                      : "Waiting for camera"}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary cursor-not-allowed px-3 opacity-50"
                disabled
                aria-label="Camera stays on during the interview"
                title="Camera stays on for the full interview"
              >
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
            <button
              className={`btn-secondary justify-center ${listening ? "border-coral text-coral" : autoVoiceMode ? "border-lime/40 text-lime" : ""}`}
              onClick={() => {
                if (listening) {
                  setAutoVoiceMode(false);
                  stopListening();
                  return;
                }
                setAutoVoiceMode(true);
                listenIntentRef.current = true;
                startListening();
              }}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
              {listening ? "Pause mic" : autoVoiceMode ? "Auto mic on" : "Start mic"}
            </button>
            <button
              type="button"
              className={`btn-secondary cursor-not-allowed justify-center opacity-50 ${cameraEnabled ? "border-lime/50 text-lime" : ""}`}
              disabled
              aria-label="Camera stays on during the interview"
              title="Camera stays on for the full interview"
            >
              {cameraEnabled ? <CameraOff size={18} /> : <Camera size={18} />} Camera
            </button>
          </div>
          <div className="min-w-56">
            <div className="h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-cyan" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-right text-xs text-slate-500">Interview progress {progress}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.25fr_1fr]">
        <div className="panel">
          <p className="text-sm text-slate-500">Difficulty evolution</p>
          <div className="mt-3 inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan shadow-[0_0_34px_rgba(92,225,230,0.12)]">
            {difficultyStage}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">{selectedInterviewer.name} is adjusting depth based on answer quality.</p>
        </div>
        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Live recruiter signals</h3>
              <p className="mt-1 text-sm text-slate-500">Updates after every answer using communication, rubric, and confidence signals.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{latestFeedback?.hireSignal?.replace("_", " ") || "calibrating"}</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {metricLabels.map(([key, label]) => (
              <div key={key} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{label}</span><span className="text-cyan">{Math.round(liveMetrics[key])}%</span></div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-cyan transition-all duration-700" style={{ width: `${Math.min(100, Math.round(liveMetrics[key]))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.36fr]">
        <div className="panel p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-xl font-semibold">Live transcript</h3>
              <p className="mt-1 text-sm text-slate-500">Greeting, warm-up intro, then personalized questions with adaptive replies.</p>
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
                className="field min-h-7 resize-none leading-6"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
                }}
                placeholder="Speak naturally — mic turns on automatically. After you pause ~5 seconds, your answer is sent."
              />
              <button onClick={submit} className="btn-primary min-h-14 px-6" disabled={submitting || cleanAnswerText(answer).length < MIN_SPOKEN_ANSWER_CHARS} aria-label="Send answer">
                <Send size={20} /> {autoSendPending ? "Sending..." : "Send"}
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
