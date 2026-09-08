export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1920

export type ShareCardStat = { label: string; value: number }

export type ShareCardBreakdownRow = { label: string; value: string }

export type ShareCardData = {
  name: string
  timeLabel: string
  // Détail clics/souris/espace/rank, affiché en une ligne "label: valeur" chacun.
  breakdown: ShareCardBreakdownRow[]
  stats: ShareCardStat[]
  titleLabel: string
  emoji: string
  quip: string
  siteLabel: string
}

const BG = '#F4F4F0'
const INK = '#0A0A0A'
const RED = '#FF2A2A'

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = words[0] || ''
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = words[i]
    } else {
      current = test
    }
  }
  lines.push(current)
  return lines
}

/** Affiche le temps en minutes ("3min 24s") au-delà d'une minute, sinon en secondes. */
export function formatCardTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

/**
 * Dessine la carte de résultat (format story verticale 1080x1920) sur un canvas
 * déjà dimensionné par l'appelant. Volontairement léger (pas d'images externes,
 * juste des formes + du texte) pour rester rapide même sur mobile bas de gamme.
 */
export function drawShareCard(canvas: HTMLCanvasElement, data: ShareCardData) {
  canvas.width = SHARE_CARD_WIDTH
  canvas.height = SHARE_CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = SHARE_CARD_WIDTH
  const H = SHARE_CARD_HEIGHT
  const pad = 72

  // Fond + bordure "brutaliste" cohérente avec le reste du jeu
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)

  // Grille de points en fond, léger clin d'oeil au jeu
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  for (let y = 60; y < H - 60; y += 40) {
    for (let x = 60; x < W - 60; x += 40) {
      ctx.fillRect(x, y, 3, 3)
    }
  }

  let y = pad + 40

  // Header : PIXELTROLL
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.font = '900 64px "Courier New", monospace'
  ctx.fillText('PIXELTROLL', pad, y)
  y += 70

  ctx.fillStyle = RED
  ctx.fillRect(pad, y - 34, 220, 10)
  y += 90

  // Nom du joueur
  ctx.fillStyle = INK
  ctx.font = '900 88px "Courier New", monospace'
  const nameLines = wrapLines(ctx, data.name.toUpperCase(), W - pad * 2)
  nameLines.forEach((line) => {
    ctx.fillText(line, pad, y)
    y += 96
  })
  y += 20

  // Clics + temps
  ctx.font = '700 46px "Courier New", monospace'
  ctx.fillStyle = INK
  ctx.fillText(data.timeLabel, pad, y)
  y += 60

  // Détail clics / souris / espace / rank, une ligne par valeur
  ctx.font = '700 34px "Courier New", monospace'
  data.breakdown.forEach((row) => {
    ctx.fillStyle = INK
    ctx.textAlign = 'left'
    ctx.fillText(row.label.toUpperCase(), pad, y)
    ctx.fillStyle = RED
    ctx.textAlign = 'right'
    ctx.fillText(row.value, W - pad, y)
    ctx.textAlign = 'left'
    y += 46
  })
  y += 44

  // Séparateur
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 70

  // Stats absurdes : une par ligne, avec une barre de progression sous chaque libellé
  const rowH = 128
  const barW = W - pad * 2
  const barH = 28
  data.stats.forEach((stat, i) => {
    const by = y + i * rowH

    ctx.fillStyle = INK
    ctx.font = '800 34px "Courier New", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(stat.label.toUpperCase(), pad, by)

    ctx.fillStyle = RED
    ctx.font = '900 34px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${stat.value}/100`, W - pad, by)
    ctx.textAlign = 'left'

    const barY = by + 22
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    ctx.strokeRect(pad, barY, barW, barH)

    const filled = Math.max(0, Math.min(100, stat.value)) / 100
    ctx.fillStyle = RED
    ctx.fillRect(pad + 3, barY + 3, Math.max(0, filled * barW - 6), barH - 6)
  })
  y += data.stats.length * rowH + 20

  // Badge titre
  ctx.fillStyle = INK
  ctx.fillRect(pad, y, W - pad * 2, 130)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 58px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`${data.emoji} ${data.titleLabel}`, W / 2, y + 82)
  ctx.textAlign = 'left'
  y += 170

  // Phrase troll
  ctx.fillStyle = INK
  ctx.font = 'italic 700 38px "Courier New", monospace'
  const quipLines = wrapLines(ctx, `"${data.quip}"`, W - pad * 2)
  quipLines.forEach((line) => {
    ctx.fillText(line, pad, y)
    y += 50
  })

  // Footer : URL du site, toujours collée en bas
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad, H - 140)
  ctx.lineTo(W - pad, H - 140)
  ctx.stroke()

  ctx.fillStyle = RED
  ctx.font = '900 42px "Courier New", monospace'
  ctx.fillText(data.siteLabel, pad, H - 90)
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92)
  })
}

export type ShareOutcome = 'shared_native' | 'shared_native_text_only' | 'copied' | 'failed'

/**
 * Partage en 1 clic : tente d'abord le partage natif avec l'image (mobile),
 * puis le partage natif texte seul, puis en dernier recours copie le texte
 * dans le presse-papiers. Ne bloque jamais l'utilisateur derrière plusieurs écrans.
 */
export async function shareResult(opts: {
  title: string
  text: string
  url: string
  canvas?: HTMLCanvasElement | null
  filename?: string
}): Promise<ShareOutcome> {
  const { title, text, url, canvas, filename = 'pixeltroll-result.png' } = opts
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>
    canShare?: (data?: ShareData) => boolean
  }

  if (canvas && nav.share) {
    try {
      const blob = await canvasToBlob(canvas)
      if (blob) {
        const file = new File([blob], filename, { type: 'image/png' })
        const shareData: ShareData = { title, text, files: [file] }
        if (!nav.canShare || nav.canShare(shareData)) {
          await nav.share(shareData)
          return 'shared_native'
        }
      }
    } catch (err) {
      // AbortError = l'utilisateur a juste annulé le partage : pas un échec à rattraper.
      if ((err as { name?: string })?.name === 'AbortError') return 'shared_native'
    }
  }

  if (nav.share) {
    try {
      await nav.share({ title, text, url })
      return 'shared_native_text_only'
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return 'shared_native_text_only'
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
