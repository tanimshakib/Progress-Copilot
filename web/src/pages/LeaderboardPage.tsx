import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { api } from '../lib/api';

type LeagueType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

const LEAGUES: {
  key: LeagueType;
  label: string;
  icon: string;
  badgeBg: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
}[] = [
  {
    key: 'BRONZE',
    label: 'Bronze League',
    icon: '🥉',
    badgeBg: 'bg-amber-900/30 dark:bg-amber-950/50',
    borderColor: 'border-amber-600/50',
    glowColor: 'shadow-[0_0_20px_rgba(180,83,9,0.3)]',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'SILVER',
    label: 'Silver League',
    icon: '🥈',
    badgeBg: 'bg-slate-500/20 dark:bg-slate-800/50',
    borderColor: 'border-slate-400/50',
    glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]',
    textColor: 'text-slate-600 dark:text-slate-300',
  },
  {
    key: 'GOLD',
    label: 'Gold League',
    icon: '🥇',
    badgeBg: 'bg-yellow-500/20 dark:bg-yellow-950/50',
    borderColor: 'border-yellow-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.4)]',
    textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    key: 'PLATINUM',
    label: 'Platinum League',
    icon: '💎',
    badgeBg: 'bg-cyan-500/20 dark:bg-cyan-950/50',
    borderColor: 'border-cyan-400/60',
    glowColor: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
    textColor: 'text-cyan-600 dark:text-cyan-300',
  },
  {
    key: 'DIAMOND',
    label: 'Diamond League',
    icon: '👑',
    badgeBg: 'bg-fuchsia-500/20 dark:bg-fuchsia-950/50',
    borderColor: 'border-fuchsia-500/60',
    glowColor: 'shadow-[0_0_30px_rgba(217,70,239,0.5)]',
    textColor: 'text-fuchsia-600 dark:text-fuchsia-300',
  },
];

export function LeaderboardPage() {
  const [selectedLeague, setSelectedLeague] = useState<LeagueType | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', selectedLeague],
    queryFn: async () => {
      const url = selectedLeague ? `/api/leaderboard?league=${selectedLeague}` : '/api/leaderboard';
      const res = await api.get(url);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const currentLeague = (selectedLeague || data?.currentUser?.league || 'BRONZE') as LeagueType;
  const activeLeagueMeta = LEAGUES.find((l) => l.key === currentLeague) || LEAGUES[0];

  const leaderboard = data?.leaderboard || [];
  const currentUserInfo = data?.currentUser;

  // Podium splits
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const listItems = leaderboard.slice(3);

  const currentUserInList = currentUserInfo && currentUserInfo.rank > 3;

  return (
    <div className="relative min-h-screen pb-24 space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto">
      {/* ────────────────────── Banner Header ────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-slate-900/90 border border-purple-500/30 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold tracking-wide uppercase">
              <Trophy size={14} className="text-yellow-400" /> Arena & League Standings
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 bg-clip-text text-transparent">
              Weekly Leaderboards
            </h1>
            <p className="text-sm text-purple-200/80 max-w-xl">
              Earn weekly points by completing tasks and targets. The top 20% get promoted to higher leagues every Sunday at midnight!
            </p>
          </div>

          {/* Current User League Card */}
          {currentUserInfo && (
            <div className="shrink-0 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-purple-500/20 border border-purple-400/40 shadow-inner">
                {activeLeagueMeta.icon}
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                  Your Current Standing
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white">
                    Rank #{currentUserInfo.rank || '-'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold flex items-center gap-1">
                    <Zap size={12} /> {currentUserInfo.weeklyPoints} pts
                  </span>
                </div>
                <p className="text-xs text-purple-200/70 mt-0.5">{currentUserInfo.league} League</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────── League Selector Tabs ────────────────────── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1.5 scrollbar-none">
        {LEAGUES.map((league) => {
          const isActive = currentLeague === league.key;
          return (
            <button
              key={league.key}
              type="button"
              onClick={() => setSelectedLeague(league.key)}
              className={`relative flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shrink-0 border ${
                isActive
                  ? `${league.badgeBg} ${league.borderColor} ${league.textColor} ${league.glowColor} border-2 scale-105`
                  : 'bg-white/70 dark:bg-white/[0.03] border-purple-200/60 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-purple-400'
              }`}
            >
              <span className="text-lg">{league.icon}</span>
              <span>{league.label}</span>
              {data?.currentUser?.league === league.key && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold uppercase">
                  You
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 py-12 text-center">
          <div className="inline-block w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-purple-300">
            Loading leaderboard standings...
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-center font-bold">
          Failed to load leaderboard. Please try again.
        </div>
      )}

      {!isLoading && !isError && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLeague}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {/* ────────────────────── Podium UI (Top 3) ────────────────────── */}
            {leaderboard.length > 0 && (
              <div className="pt-8 pb-4">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles className="text-yellow-400" size={18} />
                    Top Champions — {activeLeagueMeta.label}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Leading the pack with the highest weekly task completions
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto px-2">
                  {/* Rank 2 (Left) */}
                  <PodiumCard
                    user={top2}
                    rank={2}
                    crownColor="text-slate-300"
                    badgeBg="bg-slate-400/20 text-slate-300 border-slate-400/40"
                    ringColor="ring-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.4)]"
                    heightClass="h-44 sm:h-52"
                    icon="🥈"
                  />

                  {/* Rank 1 (Center) */}
                  <PodiumCard
                    user={top1}
                    rank={1}
                    crownColor="text-yellow-400"
                    badgeBg="bg-yellow-500/30 text-yellow-300 border-yellow-400/50"
                    ringColor="ring-yellow-400 ring-4 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                    heightClass="h-56 sm:h-64 scale-105 z-10"
                    icon="👑"
                  />

                  {/* Rank 3 (Right) */}
                  <PodiumCard
                    user={top3}
                    rank={3}
                    crownColor="text-amber-600 dark:text-amber-400"
                    badgeBg="bg-amber-600/20 text-amber-400 border-amber-500/40"
                    ringColor="ring-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.4)]"
                    heightClass="h-36 sm:h-44"
                    icon="🥉"
                  />
                </div>
              </div>
            )}

            {/* Empty state */}
            {leaderboard.length === 0 && (
              <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-purple-200/60 dark:border-white/10">
                <Shield size={40} className="mx-auto text-purple-400/60 mb-3" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  No competitors in this league yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Be the first to complete tasks and climb to the top of the {activeLeagueMeta.label}!
                </p>
              </div>
            )}

            {/* ────────────────────── List UI (Rank 4+) ────────────────────── */}
            {listItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1">
                  Challengers ({listItems.length})
                </h3>

                <div className="space-y-2">
                  {listItems.map((user: any) => {
                    const isSelf = user.isCurrentUser;
                    const initial = (user.fullName || '?').trim().charAt(0).toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between gap-4 p-3.5 rounded-2xl transition-all ${
                          isSelf
                            ? 'bg-gradient-to-r from-purple-900/40 via-fuchsia-900/30 to-purple-900/40 border-2 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.35)]'
                            : 'bg-white/80 dark:bg-white/[0.03] border border-purple-200/60 dark:border-white/10 hover:border-purple-400'
                        }`}
                      >
                        {/* Left: Rank + Avatar + Name */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                              isSelf
                                ? 'bg-fuchsia-500 text-white shadow-md'
                                : 'bg-purple-500/10 text-purple-700 dark:text-violet-300'
                            }`}
                          >
                            #{user.rank}
                          </span>

                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-purple-500/30">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm">
                                {initial}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              {user.fullName}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-extrabold">
                                  YOU
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-violet-300/70 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Flame size={12} className="text-orange-400" /> {user.dailyStreak}d streak
                              </span>
                              <span>•</span>
                              <span>{user.points} total pts</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Weekly & Total Points */}
                        <div className="shrink-0 text-right space-y-1">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-fuchsia-300 font-extrabold text-xs border border-purple-500/20 shadow-sm">
                            <Zap size={13} className="text-yellow-400" />
                            {user.weeklyPoints} wk pts
                          </div>
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-300 flex items-center justify-end gap-1">
                            ⭐ {user.points} total pts
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ────────────────────── Sticky Bottom User Standing Bar ────────────────────── */}
      {currentUserInList && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-40">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-slate-900/95 backdrop-blur-xl border-2 border-fuchsia-500 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-lg font-bold text-fuchsia-300 shrink-0">
                #{currentUserInfo.rank}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-fuchsia-300 flex items-center gap-1 uppercase tracking-wider">
                  <UserCheck size={14} /> Your Standing
                </p>
                <p className="text-sm font-bold text-white truncate">
                  Rank #{currentUserInfo.rank} in {currentUserInfo.league} League
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-extrabold flex items-center gap-1">
                <Zap size={13} /> {currentUserInfo.weeklyPoints} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────── Podium Card Helper ────────────────────── */

function PodiumCard({
  user,
  rank,
  crownColor,
  badgeBg,
  ringColor,
  heightClass,
  icon,
}: {
  user?: any;
  rank: number;
  crownColor: string;
  badgeBg: string;
  ringColor: string;
  heightClass: string;
  icon: string;
}) {
  if (!user) {
    return (
      <div
        className={`flex flex-col items-center justify-end p-4 rounded-3xl bg-white/40 dark:bg-white/[0.02] border border-dashed border-purple-300/40 dark:border-white/10 ${heightClass}`}
      >
        <span className="text-2xl opacity-40">{icon}</span>
        <span className="text-xs text-slate-400 mt-2 font-medium">Empty</span>
      </div>
    );
  }

  const initial = (user.fullName || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex flex-col items-center justify-between p-3 sm:p-4 rounded-3xl bg-gradient-to-b from-white/90 via-purple-50/80 to-indigo-100/90 dark:from-[#1d143a]/90 dark:via-[#160e2e]/90 dark:to-[#0f0920]/90 backdrop-blur-xl border border-purple-200/80 dark:border-purple-500/30 shadow-xl transition-transform ${heightClass}`}
    >
      {/* Crown */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Crown size={24} className={`${crownColor} drop-shadow-md`} />
      </div>

      {/* Avatar */}
      <div className="mt-3 flex flex-col items-center">
        <div className={`relative w-12 sm:w-16 h-12 sm:h-16 rounded-full overflow-hidden ring-4 ${ringColor}`}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-600 text-white font-extrabold text-base sm:text-xl">
              {initial}
            </div>
          )}
        </div>

        {/* Rank Badge */}
        <span
          className={`-mt-3 px-2 py-0.5 rounded-full font-extrabold text-[10px] sm:text-xs border shadow-sm z-10 ${badgeBg}`}
        >
          Rank #{rank}
        </span>
      </div>

      {/* User Info */}
      <div className="text-center w-full min-w-0 mt-2 space-y-1">
        <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
          {user.fullName}
        </p>
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-fuchsia-300 font-extrabold text-[11px]">
            <Zap size={11} className="text-yellow-400" />
            {user.weeklyPoints} wk pts
          </span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">
            ⭐ {user.points} total pts
          </span>
        </div>
      </div>
    </div>
  );
}
