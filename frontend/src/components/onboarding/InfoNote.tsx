import { Info } from "lucide-react";

interface InfoNoteProps {
  title: string;
  children: React.ReactNode;
}

/** Calm "why we ask" explainer — lilac panel, not a warning. */
export function InfoNote({ title, children }: InfoNoteProps) {
  return (
    <div className="flex gap-3 rounded-control border border-brand-200/60 bg-lilac p-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div>
        <p className="text-xs font-semibold text-brand-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-600">{children}</p>
      </div>
    </div>
  );
}
