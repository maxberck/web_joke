type Props = {
  t: any
  remainingPossibilities: number
  cap: number
  onStop: () => void
}

/** Écran de fin quand les 200 essais du jour sont épuisés : définitif jusqu'à demain. */
export default function OutOfAttemptsModal({ t, remainingPossibilities, cap, onStop }: Props) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <span className="border border-black bg-[#F4F4F0] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide">
          {cap}/{cap}
        </span>
        <h2 className="mt-3 text-lg font-black leading-tight tracking-tight text-black">{t.outOfAttemptsRationedTitle}</h2>
        <p className="mt-2 font-mono text-xs leading-snug text-zinc-600">{t.outOfAttemptsRationedBody(remainingPossibilities)}</p>

        <button
          type="button"
          onClick={onStop}
          className="mt-5 w-full border-2 border-black bg-black p-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform"
        >
          {t.limitedPlayAgainTomorrow}
        </button>
      </div>
    </div>
  )
}
