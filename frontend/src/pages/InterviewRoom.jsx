import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrainCircuit, Camera, Clock3, Mic, MicOff, Radio, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const latestInterviewerLine = [...messages].reverse().find((item) => item.speaker === "interviewer")?.text || currentQuestion;

  return (
    <div className="-mx-5 -mt-6 flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] flex-col overflow-hidden lg:-mt-8 lg:h-[calc(100dvh-5.25rem)] lg:max-h-[calc(100dvh-5.25rem)]">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#070B16] shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-cyan">
              <Radio size={14} className={speaking || listening ? "animate-pulse" : ""} />
              Live interview
            </div>
            <h2 className="truncate text-lg font-semibold">{session.interview.role}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-cyan">{difficultyStage}</span>
            <span className="rounded-md border border-white/10 bg-night/60 px-2.5 py-1.5">
              <Clock3 size={14} className="mr-1 inline text-cyan" />
              {minutes}:{rest}
            </span>
            <span className="rounded-md border border-white/10 bg-night/60 px-2.5 py-1.5">{turn}/{maxTurns}</span>
            <span className="rounded-md border border-white/10 bg-night/60 px-2.5 py-1.5">{progress}%</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_auto] xl:grid-cols-[1.05fr_1fr_0.88fr] xl:grid-rows-1">
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-cyan/20 bg-[radial-gradient(circle_at_50%_30%,rgba(92,225,230,0.22),transparent_34%),linear-gradient(135deg,#10182A,#070914)] p-4 lg:min-h-[240px] xl:min-h-0">
            <div className="absolute right-3 top-3 rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] text-cyan">
              {speaking ? "Speaking" : selectedInterviewer.name}
            </div>
            <div className="flex h-full min-h-0 flex-col items-center justify-center text-center">
              <motion.div
                animate={speaking ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: speaking ? Infinity : 0 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan/30 bg-cyan text-night xl:h-28 xl:w-28"
              >
                <BrainCircuit size={44} />
              </motion.div>
              <p className="mt-3 text-sm font-medium text-slate-200">HireSense Interviewer</p>
              <div className="mt-2">
                <Waveform active={speaking} />
              </div>
              <p className="mt-2 line-clamp-2 max-w-md text-xs leading-5 text-slate-400">
                {speaking ? "Speaking now" : listening ? "Listening to you" : "Waiting for your answer"}
              </p>
            </div>
          </div>

          <div className="relative min-h-0 overflow-hidden rounded-lg border border-white/10 bg-[#0B1020] lg:min-h-[240px] xl:min-h-0">
            <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-night/70 px-2.5 py-1 text-[11px] text-slate-300">
              You
            </div>
            <video ref={videoRef} className={`h-full min-h-[220px] w-full object-cover lg:min-h-0 ${cameraEnabled ? "" : "opacity-0"}`} autoPlay muted playsInline />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B1020] px-4 text-center text-sm text-slate-300">
                {cameraError || "Starting camera..."}
              </div>
            )}
            <div className={`absolute bottom-3 left-3 right-3 rounded-lg border bg-night/85 px-3 py-2 text-xs backdrop-blur-xl ${listening ? "border-coral/50" : "border-white/10"}`}>
              {listening
                ? autoSendPending
                  ? "Sending after ~3s pause..."
                  : "Mic on · auto-send after ~3s pause"
                : cameraEnabled
                  ? "Camera on"
                  : "Camera starting"}
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0A0F1C] lg:col-span-2 lg:max-h-[220px] xl:col-span-1 xl:max-h-none">
            <div className="shrink-0 border-b border-white/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live transcript</p>
                <Sparkles className="text-cyan" size={16} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-cyan">{latestInterviewerLine}</p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((message, index) => {
                const isCandidate = message.speaker === "candidate";
                return (
                  <motion.div
                    key={`${message.text}-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[95%] rounded-lg px-3 py-2 ${isCandidate ? "bg-cyan text-night" : "border border-white/10 bg-white/[0.05] text-slate-100"}`}>
                      <div className="mb-1 flex items-center gap-2 text-[10px]">
                        <span className={isCandidate ? "text-night/70" : "text-cyan"}>{isCandidate ? "You" : "Interviewer"}</span>
                        {message.meta && <span className={isCandidate ? "text-night/60" : "text-slate-500"}>{message.meta.replace("Â·", "-")}</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-xs leading-5">{message.text}</p>
                    </div>
                  </motion.div>
                );
              })}
              {submitting && (
                <p className="text-xs text-slate-500">Interviewer is evaluating your answer...</p>
              )}
              <div ref={endRef} />
            </div>

            <div className="shrink-0 border-t border-white/10 p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <button type="button" className={`btn-secondary px-2.5 py-1.5 text-xs ${voiceEnabled ? "border-cyan/40 text-cyan" : ""}`} onClick={() => setVoiceEnabled((value) => !value)}>
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Voice
                </button>
                <button
                  type="button"
                  className={`btn-secondary px-2.5 py-1.5 text-xs ${listening ? "border-coral text-coral" : autoVoiceMode ? "border-lime/40 text-lime" : ""}`}
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
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? "Pause" : "Auto mic"}
                </button>
                <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => speakInterviewer(latestInterviewerLine)}>
                  <Volume2 size={14} /> Replay
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <textarea
                  id="live-answer"
                  className="field min-h-[52px] resize-none py-2 text-sm leading-5"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
                  }}
                  placeholder="Speak — auto-sends after ~3s pause"
                />
                <button
                  type="button"
                  onClick={submit}
                  className="btn-primary px-4 py-2"
                  disabled={submitting || cleanAnswerText(answer).length < MIN_SPOKEN_ANSWER_CHARS}
                >
                  <Send size={18} /> {autoSendPending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {cameraError && <p className="shrink-0 px-4 pb-2 text-xs text-coral">{cameraError}</p>}
      </section>
    </div>
  );
}
