import clsx from "clsx";
import { appealStatusLabel, appealStatusStyle, type AppealStatus } from "../../lib/appeals";

export function AppealStatusBadge({ status }: { status: AppealStatus }) {
    const s = appealStatusStyle[status] ?? appealStatusStyle.draft;

    return (
        <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', s.pill)}>
            <span className={clsx('h-1.5 w-1.5 flex-shrink-0 rounded-full', s.dot)} />
            {appealStatusLabel[status] ?? status}
        </span>
    );
}