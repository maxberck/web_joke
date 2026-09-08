import { useEffect, useMemo, useState } from 'react'
import PixelDotsCanvas, { type DotPoint } from '../components/PixelDotsCanvas'
import PixelTextAssembler from '../components/PixelTextAssembler'
import VictoryModal from '../components/VictoryModal'
import OutOfAttemptsModal from '../components/OutOfAttemptsModal'
import { usePixelGame, winsKeyFor } from '../hooks/usePixelGame'
import { getBreakpoint, getDailyPixelPercent, getTodayKey } from '../utils/dailyPixel'
import { getWinTier } from '../utils/winTier'
import { translations, initialLang } from '../utils/i18n'
import { trackEvent } from '../utils/analytics'

const TOP_OFFSET = 56
const BOTTOM_OFFSET = 56
const BASE_CAP = 200
const COFFEE_URL = 'https://buymeacoffee.com/f8rbvfvwz4o'
const MODE = 'rationed' as const

type Status = { date: string; outcome: 'won' | 'stopped' | null; time: number; misses: number; cap: number }

const STATUS_KEY = 'pixeltroll_rationed_status'

function readStatus(): Status | null {
  try {
    const raw = localStorage.getItem(STATUS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Status
    return parsed.date === getTodayKey() ? parsed : null
  } catch {
    return null
  }
}

function writeStatus(status: Status) {
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(status))
  } catch {
    // stockage indisponible : le statut sera juste redemandé au prochain chargement
  }
}

/**
 * Pixel Rationné : comme le Pixel du Jour classique (un pixel fixe par jour), mais
 * plafonné à 200 essais et sans aucune des mécaniques des autres modes (aide,
 * couloirs, easter eggs clavier) — juste des commentaires dédiés au compte à rebours.
 */
export default function LimitedPixelPage({ onHome }: { onHome: () => void }) {
  const [existingStatus] = useState(() => readStatus())
  const t = translations[initialLang]

  if (existingStatus && existingStatus.outcome) {
    return (
      <div className="relative flex min-h-[100dvh] w-full items-center justify-center bg-[#F4F4F0] p-4 font-sans text-black">
        <div className="w-full max-w-sm border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="mb-2 text-lg font-black tracking-tight">{t.rationedHeaderLabel}</h2>
          <p className="mb-4 font-mono text-xs leading-snug text-zinc-600">
            {existingStatus.outcome === 'won'
              ? t.limitedRecapWonMsg(existingStatus.time, existingStatus.misses)
              : t.limitedRecapStoppedMsg(existingStatus.misses, existingStatus.cap)}
          </p>
          <button type="button" onClick={onHome} className="w-full border-2 border-black bg-black p-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform">
            {t.homeBtn}
          </button>
        </div>
      </div>
    )
  }

  return <LimitedPixelGame onHome={onHome} cap={existingStatus?.cap ?? BASE_CAP} />
}

function LimitedPixelGame({ onHome, cap }: { onHome: () => void; cap: number }) {
  const [abandonHover, setAbandonHover] = useState(false)
  const [statusLocked, setStatusLocked] = useState(false)

  const fixedPixel = useMemo(() => {
    const bp = getBreakpoint(window.innerWidth)
    const { px, py } = getDailyPixelPercent(getTodayKey(), bp, MODE)
    return {
      x: Math.round(px * (window.innerWidth - 1)),
      y: Math.round(TOP_OFFSET + py * (window.innerHeight - TOP_OFFSET - BOTTOM_OFFSET - 1)),
    }
  }, [])

  const [tier] = useState(() => {
    const wins = Number(localStorage.getItem(winsKeyFor(MODE))) || 0
    return { ...getWinTier(wins), wins }
  })

  const g = usePixelGame(MODE, TOP_OFFSET, fixedPixel, undefined, BOTTOM_OFFSET, cap)

  const persist = (outcome: Status['outcome']) => {
    if (statusLocked) return
    setStatusLocked(true)
    writeStatus({ date: getTodayKey(), outcome, time: g.runTime, misses: g.uniqueExploredCount, cap })
  }

  useEffect(() => {
    if (g.victory) {
      persist('won')
      trackEvent('daily_completed', { mode: MODE, time: g.runTime, misses: g.uniqueExploredCount })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.victory])

  const handleHome = () => {
    if (!g.victory) persist('stopped')
    onHome()
  }

  const dotPoints = useMemo<DotPoint[]>(
    () => g.dots.map((d) => ({ x: d.x, y: d.y, size: 2, color: tier.color })),
    [g.dots, tier.color]
  )

  const remainingPossibilities = Math.max(0, g.totalScreenPixels - g.uniqueExploredCount)

  return (
    <div
      className="relative h-[100dvh] w-screen overflow-hidden bg-white select-none font-sans touch-none cursor-crosshair"
      onClick={g.onMiss}
    >
      <div
        className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between px-2 sm:px-4 bg-white/90 border-b border-black/10 backdrop-blur-sm cursor-default"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={{
            transform: `translate(${g.giveUpPos.x}px, ${g.giveUpPos.y}px)`,
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={() => setAbandonHover(true)}
          onMouseLeave={() => setAbandonHover(false)}
          onClick={() => g.handleGiveUpClick(handleHome)}
          className="shrink-0 max-w-[30%] truncate border border-black bg-white px-2 sm:px-2.5 py-1 font-mono text-[10px] sm:text-xs font-bold text-zinc-600 transition-all hover:border-[#FF2A2A] hover:bg-[#FF2A2A] hover:text-white"
        >
          {abandonHover ? g.t.giveUpHover : g.t.giveUp}
        </button>

        <span className="pointer-events-none absolute left-1/2 max-w-[36%] -translate-x-1/2 truncate text-center font-mono text-[10px] sm:text-xs font-black tracking-wider text-black">
          {g.t.rationedHeaderLabel}
        </span>

        <div className="max-w-[42%] min-w-0 shrink truncate border border-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {g.t.attemptsLeftLabel(g.attemptsLeft ?? 0, cap)}
        </div>
      </div>

      <PixelDotsCanvas points={dotPoints} />

      <button
        type="button"
        aria-label="pixel"
        onClick={g.onWin}
        className="absolute z-10 cursor-crosshair border-0 p-0"
        style={{ left: g.pixel.x, top: g.pixel.y, width: 1, height: 1, background: 'transparent' }}
      />

      {g.activeMsg && <PixelTextAssembler text={g.activeMsg} onComplete={g.onCompleteMsg} />}

      {/* Emplacement pub vide : juste le lien de soutien, pas de faux bandeau publicitaire
          ici (les paliers de texte du footer des autres modes sont calibrés pour des
          parties bien plus longues que 200 clics). */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-center px-2 sm:px-4 gap-2 bg-white/90 border-t border-black/10 backdrop-blur-sm cursor-default"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 border-2 border-black bg-[#FFDD57] px-2.5 py-1 font-mono text-[10px] sm:text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform"
        >
          {g.t.footerCoffeeLabel}
        </a>
      </div>

      {g.outOfAttempts && (
        <OutOfAttemptsModal t={g.t} cap={cap} remainingPossibilities={remainingPossibilities} onStop={handleHome} />
      )}

      {g.victory && (
        <VictoryModal
          mode="impatient"
          modeLabel={g.t.rationedHeaderLabel}
          runTime={g.runTime}
          runMisses={g.runMisses}
          wins={g.wins}
          t={g.t}
          customDesc={g.t.limitedRecapWonMsg(g.runTime, g.uniqueExploredCount)}
          helpCount={g.helpCount}
          bumperLevel={g.bumperLevel}
          cps={g.cps}
          usedOtherKeys={g.usedOtherKeys}
          mouseClicks={g.mouseClicks}
          spaceClicks={g.spaceClicks}
          grade={g.grade}
          gradeComment={g.gradeComment}
          challengeResult={null}
          incomingChallengeName={null}
          profile={g.profile}
          playerName={g.playerName}
          shareStep={g.shareStep}
          nameDraft={g.nameDraft}
          setNameDraft={g.setNameDraft}
          pseudoConfirmTypo={g.pseudoConfirmTypo}
          pseudoJoke={g.pseudoJoke}
          lastShareOutcome={g.lastShareOutcome}
          onClearShareOutcome={g.clearShareOutcome}
          onStartShare={g.startShareFlow}
          onChangeName={g.changeName}
          onSubmitPseudoName={g.submitPseudoName}
          onAcceptPseudoTypo={g.onAcceptPseudoTypo}
          onForcePseudoSpelling={g.onForcePseudoSpelling}
          onShareResult={g.shareTheResult}
          onBeatMyScore={g.shareBeatMyScore}
          onCloseShareFlow={g.closeShareFlow}
          onReplay={handleHome}
          onHome={handleHome}
          hideReplay
        />
      )}
    </div>
  )
}
