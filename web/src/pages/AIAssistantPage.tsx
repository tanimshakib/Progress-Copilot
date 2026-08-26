import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useChats,
  useCreateChat,
  useDeleteChat,
  useMessages,
  useRenameChat,
  useSendMessage,
  mutationError,
} from '../modules/ai/useAi';
import type { ChatMessage, ChatSummary } from '../lib/types';

/* ────────────────────────────────────────────────────────────────────── */
/* Page                                                                   */
/* ────────────────────────────────────────────────────────────────────── */

export function AIAssistantPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState(false);
  const [composer, setComposer] = useState('');

  const chatsQ = useChats();
  const messagesQ = useMessages(activeChatId);
  const send = useSendMessage();
  const create = useCreateChat();
  const rename = useRenameChat();
  const remove = useDeleteChat();

  // Auto-select the newest chat when the list loads and nothing is selected.
  useEffect(() => {
    if (activeChatId || !chatsQ.data?.length) return;
    setActiveChatId(chatsQ.data[0].id);
  }, [activeChatId, chatsQ.data]);

  const activeChat: ChatSummary | undefined = chatsQ.data?.find(
    (c) => c.id === activeChatId,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = composer.trim();
    if (!text || send.isPending) return;

    // Resolve the chat id first so the optimistic user message is
    // written into the SAME cache slot the chat is already viewing.
    let chatId = activeChatId;
    if (!chatId) {
      try {
        const chat = await create.mutateAsync();
        chatId = chat.id;
        setActiveChatId(chat.id);
      } catch {
        // `create.error` is rendered by the mutation surface; bail.
        return;
      }
    }

    send.mutate({ args: { chatId, content: text }, chatId });
    setComposer('');
  }

  async function handleNewChat() {
    try {
      const chat = await create.mutateAsync();
      setActiveChatId(chat.id);
    } catch {
      /* surfaced via create.error */
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4">
      {/* ───── Sidebar ───── */}
      <ChatSidebar
        chats={chatsQ.data ?? []}
        activeId={activeChatId}
        onSelect={setActiveChatId}
        onNew={handleNewChat}
        onRename={(id, title) => rename.mutate({ chatId: id, title })}
        onDelete={(id) => {
          remove.mutate(id, {
            onSuccess: () => {
              if (id === activeChatId) setActiveChatId(null);
            },
          });
        }}
        isLoading={chatsQ.isLoading}
      />

      {/* ───── Main ───── */}
      <section className="flex-1 min-w-0 flex flex-col rounded-2xl border border-purple-200/80 dark:border-purple-500/20 bg-gradient-to-br from-white/95 via-indigo-50/80 to-purple-50/60 dark:from-[#160e2e]/90 dark:via-[#100824]/85 dark:to-[#0c061a]/95 backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-lg">
        <ChatTopBar
          title={activeChat?.title ?? 'New chat'}
          isEmpty={!activeChat}
          agentMode={agentMode}
          onToggleAgent={() => setAgentMode((v) => !v)}
        />

        <MessageList
          messages={messagesQ.data ?? []}
          isLoading={messagesQ.isFetching}
          isEmpty={!activeChat || messagesQ.data?.length === 0}
          isThinking={send.isPending}
        />

        <Composer
          value={composer}
          onChange={setComposer}
          onSubmit={handleSubmit}
          busy={send.isPending}
          error={send.error ? mutationError(send.error) : null}
        />
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Sidebar                                                                */
/* ────────────────────────────────────────────────────────────────────── */

function ChatSidebar({
  chats,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  isLoading,
}: {
  chats: ChatSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <aside className="w-72 shrink-0 flex flex-col rounded-2xl border border-purple-200/80 dark:border-purple-500/20 bg-gradient-to-b from-white/95 via-indigo-50/80 to-purple-50/60 dark:from-[#160e2e]/90 dark:via-[#100824]/85 dark:to-[#0c061a]/95 backdrop-blur-xl shadow-sm dark:shadow-lg">
      <div className="p-4 border-b border-purple-200/60 dark:border-purple-500/20">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white font-bold">
            E
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-bold leading-tight">Edith</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 leading-tight font-medium">
              Your Progress Copilot
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onNew}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-fuchsia-500 transition"
        >
          <span className="text-base leading-none">+</span> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <SkeletonRows />
        ) : chats.length === 0 ? (
          <p className="px-3 py-6 text-xs text-gray-500 text-center">
            No chats yet. Start one with the button above.
          </p>
        ) : (
          <ul className="space-y-1">
            {chats.map((c) => (
              <ChatRow
                key={c.id}
                chat={c}
                active={c.id === activeId}
                onSelect={() => onSelect(c.id)}
                onRename={(title) => onRename(c.id, title)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function ChatRow({
  chat,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  chat: ChatSummary;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    if (next && next !== chat.title) onRename(next);
    setEditing(false);
  }

  return (
    <li>
      <div
        className={[
          'group rounded-lg px-2.5 py-2 flex items-center gap-2 cursor-pointer transition-colors',
          active
            ? 'bg-purple-100/80 dark:bg-white/10 ring-1 ring-purple-400/50 dark:ring-purple-400/40'
            : 'hover:bg-purple-50/80 dark:hover:bg-white/5',
        ].join(' ')}
        onClick={() => !editing && onSelect()}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400/70 shrink-0" />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-white outline-none border-b border-purple-400/60"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800 dark:text-gray-200">
            {chat.title}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition">
          <IconButton
            label="Rename"
            onClick={(e) => {
              e.stopPropagation();
              setDraft(chat.title);
              setEditing(true);
            }}
          >
            <PencilIcon />
          </IconButton>
          <IconButton
            label="Delete"
            danger
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${chat.title}"?`)) onDelete();
            }}
          >
            <TrashIcon />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Top bar                                                                */
/* ────────────────────────────────────────────────────────────────────── */

function ChatTopBar({
  title,
  isEmpty,
  agentMode,
  onToggleAgent,
}: {
  title: string;
  isEmpty: boolean;
  agentMode: boolean;
  onToggleAgent: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-purple-200/60 dark:border-purple-500/20">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-500 font-semibold">
          Edith
        </div>
        <h2 className="text-slate-900 dark:text-white font-semibold truncate">
          {isEmpty ? 'Start a new conversation' : title}
        </h2>
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <span className="text-xs text-slate-600 dark:text-gray-300 font-medium">Agent Mode</span>
        <span
          onClick={onToggleAgent}
          role="switch"
          aria-checked={agentMode}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition',
            agentMode ? 'bg-purple-600' : 'bg-white/15',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
              agentMode ? 'translate-x-5' : 'translate-x-1',
            ].join(' ')}
          />
        </span>
      </label>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Message list                                                           */
/* ────────────────────────────────────────────────────────────────────── */

function MessageList({
  messages,
  isLoading,
  isEmpty,
  isThinking,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  isEmpty: boolean;
  isThinking: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isThinking]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
      {isEmpty ? (
        <EmptyState />
      ) : (
        <ul className="space-y-4 max-w-3xl mx-auto">
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {isThinking && <TypingBubble />}
          {isLoading && (
            <li className="text-xs text-gray-500 text-center">Loading…</li>
          )}
        </ul>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function TypingBubble() {
  return (
    <li className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-white/90 dark:bg-white/[0.06] ring-1 ring-purple-200/80 dark:ring-white/10 shadow-md">
        <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
          Edith
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-300 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-300 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-300 animate-bounce" />
        </div>
      </div>
    </li>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'USER';
  return (
    <AnimatePresence initial={false}>
      <motion.li
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}
      >
        <div
          className={[
            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md',
            isUser
              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-md'
              : 'bg-white/90 dark:bg-white/[0.06] text-slate-900 dark:text-gray-100 ring-1 ring-purple-200/80 dark:ring-white/10 rounded-bl-md',
          ].join(' ')}
        >
          {!isUser && (
            <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
              Edith
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      </motion.li>
    </AnimatePresence>
  );
}

function EmptyState() {
  const suggestions = [
    'Summarize my progress this week.',
    'What target should I focus on next?',
    'Help me draft a study plan for goal X.',
    'What patterns do you see in my streak?',
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-900/40">
        E
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
        Hi, I'm Edith.
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
        Ask me anything about your progress, goals, or next steps.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {suggestions.map((s) => (
          <div
            key={s}
            className="text-left rounded-xl border border-purple-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-3 py-2.5 text-xs text-slate-800 dark:text-gray-300 shadow-sm"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Composer                                                               */
/* ────────────────────────────────────────────────────────────────────── */

function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  error: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea up to ~6 rows.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-purple-200/60 dark:border-purple-500/20 px-4 sm:px-5 pt-3 pb-2"
    >
      {error && (
        <div className="mb-2 text-xs text-red-600 dark:text-red-300 bg-red-500/10 ring-1 ring-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl border border-purple-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#161F30]/80 focus-within:ring-2 focus-within:ring-purple-500/40 focus-within:border-purple-400 shadow-sm transition">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as FormEvent);
            }
          }}
          placeholder="Message Edith…"
          rows={1}
          className="flex-1 min-w-0 resize-none !bg-transparent !border-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 px-4 py-3 outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="m-1.5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 sm:px-4 py-2 text-sm font-bold text-white shadow-md shadow-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
        >
          <SendIcon />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-slate-400 dark:text-gray-500 text-center">
        Edith can make mistakes — verify important info.
      </p>
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Tiny bits                                                             */
/* ────────────────────────────────────────────────────────────────────── */

function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        'h-6 w-6 grid place-items-center rounded-md text-gray-400 hover:text-white hover:bg-white/10',
        danger ? 'hover:text-red-300' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SkeletonRows() {
  return (
    <ul className="space-y-2 p-2">
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="h-8 rounded-lg bg-white/[0.05] animate-pulse"
        />
      ))}
    </ul>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}