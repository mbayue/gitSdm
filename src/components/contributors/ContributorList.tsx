import type { Contributor } from '@/types';

interface ContributorListProps {
  contributors: Contributor[];
}

export function ContributorList({ contributors }: ContributorListProps) {
  if (!contributors || contributors.length === 0) {
    return <p className="text-xs text-zinc-500">No contributor data</p>;
  }

  return (
    <div className="w-full">
      <div className="-mx-2 overflow-x-auto px-2">
        <div className="flex gap-3 py-2">
          {contributors.map((c) => (
            <a
              key={c.login}
              href={`https://github.com/${c.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-20 flex-shrink-0 cursor-pointer flex-col items-center text-center outline-none"
              title={`${c.login} — ${c.contributions} contributions`}
            >
              <img
                src={c.avatarUrl}
                alt={c.login}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-violet-500 group-focus:ring-violet-500 transition-all duration-200"
              />
              <div className="mt-1 text-xs text-neutral-300 truncate w-full group-hover:text-violet-400 group-focus:text-violet-400 transition-colors duration-200">
                {c.login}
              </div>
              <div className="text-[10px] text-zinc-500">{c.contributions}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContributorList;
