import { followUpQuest, replayQuest } from "@/lib/actions";

export function QuestReplay({ dayId }: { dayId: number }) {
  return (
    <div className="flex flex-col gap-2">
      <form action={followUpQuest.bind(null, dayId)}>
        <button type="submit" className="btn btn-primary w-full">
          Ask a follow-up
        </button>
      </form>
      <form action={replayQuest.bind(null, dayId)}>
        <button type="submit" className="btn btn-secondary w-full">
          Do this quest again
        </button>
      </form>
    </div>
  );
}
