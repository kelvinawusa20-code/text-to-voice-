interface TranscriptInputProps {
  scriptText: string;
  onChange: (value: string) => void;
}

export function TranscriptInput({ scriptText, onChange }: TranscriptInputProps) {
  return (
    <div className="relative mb-8">
      <textarea
        aria-label="Transcript input"
        value={scriptText}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Speak or type here..."
        className="h-64 w-full rounded-[20px] border-4 border-slate-900 bg-slate-50 px-6 py-6 text-xl font-semibold text-slate-900 outline-none transition focus:border-slate-700 focus:ring-4 focus:ring-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700"
      />
    </div>
  );
}
