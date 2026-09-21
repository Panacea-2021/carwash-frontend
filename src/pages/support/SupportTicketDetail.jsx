import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Pause, Play, Send } from "lucide-react";
import toast from "react-hot-toast";

import { supportTicketService } from "../../api/supportTicketService";

const formatAudioTime = (value = 0) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const AudioAttachment = ({ url, label, isAdmin }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    const audio = new Audio(url);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => {
      const value = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(value);
    };
    const onTime = () => setPosition(audio.currentTime || 0);
    const onEnded = () => {
      setPlaying(false);
      setPosition(audio.duration || 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch (_) {
      setPlaying(false);
    }
  };

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const fg = isAdmin ? "text-white" : "text-indigo-600";
  const barBg = isAdmin ? "bg-white/30" : "bg-indigo-100";
  const barFill = isAdmin ? "bg-white" : "bg-indigo-500";
  const surface = isAdmin ? "bg-white/10" : "bg-[#f4f5ff]";
  const border = isAdmin ? "border-white/30" : "border-[#e0e2ff]";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${surface} ${border}`}
    >
      <button
        type="button"
        onClick={toggle}
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          isAdmin ? "bg-white/20" : "bg-white"
        }`}
      >
        {playing ? (
          <Pause className={`h-4 w-4 ${fg}`} />
        ) : (
          <Play className={`h-4 w-4 ${fg}`} />
        )}
      </button>
      <div className="flex-1">
        <div className={`text-xs font-semibold ${fg} truncate`}>{label}</div>
        <div className={`mt-2 h-1 w-full rounded-full ${barBg}`}>
          <div
            className={`h-1 rounded-full ${barFill}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={`mt-1 text-[10px] ${fg} opacity-80`}>
          {formatAudioTime(position)}
        </div>
      </div>
    </div>
  );
};

const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [files, setFiles] = useState([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const endRef = useRef(null);

  const loadTicket = useCallback(
    async (showLoader = true) => {
      if (!id) return;
      try {
        if (showLoader) {
          setLoading(true);
        }
        const res = await supportTicketService.getById(id);
        const payload = res?.data ?? res;
        setTicket(payload?.data ?? payload);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load ticket details");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await supportTicketService.listMessages(id);
      if (Array.isArray(res?.data)) {
        setMessages(res.data);
        return;
      }
      if (Array.isArray(res)) {
        setMessages(res);
        return;
      }
      setMessages([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load messages");
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
    loadMessages();
  }, [loadTicket, loadMessages]);

  useEffect(() => {
    if (!id) return undefined;
    const interval = setInterval(() => {
      loadMessages();
      loadTicket(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id, loadMessages, loadTicket]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStatusUpdate = async (status) => {
    if (!ticket?._id) return;
    try {
      setStatusUpdating(true);
      await supportTicketService.update(ticket._id, { status });
      toast.success(
        status === "resolved" ? "Ticket marked as resolved" : "Ticket reopened",
      );
      await loadTicket();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = useCallback(
    async ({ message, attachmentFiles, keepText = false }) => {
      if (!id) return;
      if (ticket?.status === "resolved") {
        toast.error("Ticket resolved. Reopen to send messages.");
        return;
      }
      const trimmed = String(message || "").trim();
      const payloadFiles = Array.isArray(attachmentFiles)
        ? attachmentFiles
        : files;

      if (!trimmed && payloadFiles.length === 0) {
        toast.error("Add a message or attachment");
        return;
      }

      try {
        setSending(true);
        const formData = new FormData();
        formData.append("message", trimmed);
        payloadFiles.forEach((file) => formData.append("attachments", file));
        await supportTicketService.sendMessage(id, formData);
        if (!keepText) {
          setMessageText("");
        }
        setFiles([]);
        await loadMessages();
      } catch (error) {
        console.error(error);
        toast.error("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [files, id, loadMessages, ticket?.status],
  );

  const handleSend = () =>
    sendMessage({ message: messageText, attachmentFiles: files });

  const startRecording = async () => {
    if (isRecording || sending) return;
    if (ticket?.status === "resolved") {
      toast.error("Ticket resolved. Reopen to send messages.");
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (!blob.size) {
          stream.getTracks().forEach((track) => track.stop());
          chunksRef.current = [];
          return;
        }
        const extension = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
            ? "m4a"
            : "webm";
        const file = new File([blob], `audio_${Date.now()}.${extension}`, {
          type: mimeType,
        });

        stream.getTracks().forEach((track) => track.stop());
        chunksRef.current = [];

        await sendMessage({
          message: "",
          attachmentFiles: [file],
          keepText: true,
        });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusBadge = useMemo(() => {
    if (!ticket) return null;
    return ticket.status === "resolved" ? (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Resolved
      </span>
    ) : (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Open
      </span>
    );
  }, [ticket]);

  const thread = useMemo(() => {
    const items = [];
    if (ticket && (ticket.description || ticket.attachments?.length)) {
      items.push({
        _id: `initial-${ticket._id || ticket.id}`,
        senderType: "staff",
        message: ticket.description || "",
        attachments: ticket.attachments || [],
        createdAt: ticket.createdAt,
        isInitial: true,
      });
    }

    messages.forEach((msg) => items.push(msg));
    return items;
  }, [messages, ticket]);

  const isResolved = ticket?.status === "resolved";

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl border border-[#e5edff] bg-white/95 p-6 shadow-[0_14px_42px_rgba(19,36,84,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#13203a]">
                Ticket #{ticket?.id || "-"}
              </h1>
              <p className="text-sm text-slate-500">
                {formatDateTime(ticket?.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge}
            <button
              type="button"
              onClick={() =>
                handleStatusUpdate(
                  ticket?.status === "resolved" ? "open" : "resolved",
                )
              }
              disabled={!ticket || statusUpdating}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                ticket?.status === "resolved"
                  ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {ticket?.status === "resolved" ? "Reopen" : "Resolve"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Ticket Details
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Staff:</span>{" "}
                    {ticket?.workerName || "-"} ({ticket?.workerMobile || "-"})
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">
                      Category:
                    </span>{" "}
                    {ticket?.category || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">
                      Status:
                    </span>{" "}
                    {ticket?.status || "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Description
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {ticket?.description || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Attachments
                </h2>
                <div className="mt-2 space-y-2 text-sm">
                  {Array.isArray(ticket?.attachments) &&
                  ticket.attachments.length > 0 ? (
                    ticket.attachments.map((file, index) => (
                      <a
                        key={`${file.filename || index}`}
                        href={file.url || file.relativePath}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-indigo-600 hover:underline"
                      >
                        <Paperclip className="h-4 w-4" />
                        {file.originalName || file.filename || "Attachment"}
                      </a>
                    ))
                  ) : (
                    <span className="text-slate-400">No attachments</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col">
              <h2 className="text-sm font-bold text-slate-700">Conversation</h2>
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-[#f7f8ff] p-4 pr-2 shadow-inner min-h-[360px] max-h-[60vh]">
                {thread.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No replies yet. Start the conversation below.
                  </div>
                ) : (
                  thread.map((msg) => {
                    const isAdmin = msg.senderType === "admin";
                    const isInitial = Boolean(msg.isInitial);
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isAdmin
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-slate-100 text-slate-700 rounded-bl-md"
                          }`}
                        >
                          <div className="text-xs font-semibold opacity-80">
                            {isAdmin
                              ? "Support"
                              : isInitial
                                ? "Ticket"
                                : "Staff"}
                          </div>
                          {msg.message ? (
                            <div className="mt-1 whitespace-pre-wrap">
                              {msg.message}
                            </div>
                          ) : null}
                          {Array.isArray(msg.attachments) &&
                          msg.attachments.length > 0 ? (
                            <div className="mt-2 space-y-2 text-xs">
                              {msg.attachments.map((file, index) => {
                                const url = file.url || file.relativePath;
                                const name =
                                  file.originalName || file.filename || "File";
                                const mimeType = (
                                  file.mimetype || ""
                                ).toLowerCase();
                                const isAudio =
                                  mimeType.startsWith("audio/") ||
                                  /\.(m4a|mp3|wav|ogg|webm)$/i.test(
                                    url || name,
                                  );

                                if (isAudio && url) {
                                  return (
                                    <AudioAttachment
                                      key={`${file.filename || index}`}
                                      url={url}
                                      label={name}
                                      isAdmin={isAdmin}
                                    />
                                  );
                                }

                                return (
                                  <a
                                    key={`${file.filename || index}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={
                                      isAdmin
                                        ? "text-white underline"
                                        : "text-indigo-600 underline"
                                    }
                                  >
                                    {name}
                                  </a>
                                );
                              })}
                            </div>
                          ) : null}
                          <div className="mt-2 text-[10px] opacity-70">
                            {formatDateTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {isResolved ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  Ticket is resolved. Reopen to send messages.
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500"
                  />
                  {files.length > 0 ? (
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {isRecording ? (
                    <div className="mt-3 text-xs font-semibold text-red-500">
                      Recording... {recordingSeconds}s
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Paperclip className="h-4 w-4" />
                      Add files
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={sending}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          isRecording
                            ? "border-red-200 bg-red-50 text-red-600"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title={
                          isRecording
                            ? "Stop audio recording"
                            : "Start audio recording"
                        }
                      >
                        {isRecording
                          ? "Audio Message Stop"
                          : "Audio Recording Start"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Send className="h-4 w-4" />
                        {sending ? "Sending" : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketDetail;
