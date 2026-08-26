import { Link } from 'react-router-dom';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform shrink-0 border border-purple-500/30">
        <img src="/logo.svg" alt="Progress Copilot Logo" className="w-full h-full object-cover rounded-full" />
        <div className="absolute inset-0 bg-purple-500 blur-md opacity-25 rounded-full -z-10" />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-extrabold text-lg leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            Progress <span className="text-purple-600 dark:text-purple-300">Copilot</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-gray-400 mt-1">
            A PLATFORM FOR SMARTER PROGRESS
          </span>
        </div>
      )}
    </Link>
  );
}