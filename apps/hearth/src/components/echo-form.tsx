import { sendEcho } from "@/lib/actions";

export function EchoForm({ dayId }: { dayId: number }) {
  return (
    <form action={sendEcho} className="flex flex-col gap-2">
      <input type="hidden" name="dayId" value={dayId} />
      <label className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
        Add a line
        <textarea
          name="text"
          required
          maxLength={280}
          rows={2}
          placeholder="A thank you, a joke, a yes let's."
          className="mt-1.5 w-full resize-none rounded-md border-[3px] border-ink bg-card px-3 py-2 text-sm text-ink"
        />
      </label>
      <button type="submit" className="btn btn-secondary w-full">
        Leave it on this quest
      </button>
    </form>
  );
}
