import { PLATFORM_FAVICON_SRC } from '../constants/platformBrand'

const DEFAULT_FAVICON = PLATFORM_FAVICON_SRC
const FAVICON_SIZE = 64
const FAVICON_RADIUS = 14

function writeFavicon(href, type = '') {
  const nextHref = href || DEFAULT_FAVICON
  let link = document.querySelector("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  if (type) link.type = type
  link.href = nextHref
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function makeRoundedFavicon(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = FAVICON_SIZE
        canvas.height = FAVICON_SIZE
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE)
        ctx.save()
        roundedRectPath(ctx, 0, 0, FAVICON_SIZE, FAVICON_SIZE, FAVICON_RADIUS)
        ctx.clip()
        ctx.drawImage(image, 0, 0, FAVICON_SIZE, FAVICON_SIZE)
        ctx.restore()
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = reject
    image.src = src
  })
}

export async function setBrowserFavicon(href) {
  if (!href) {
    writeFavicon(DEFAULT_FAVICON, 'image/png')
    return
  }

  try {
    const roundedHref = await makeRoundedFavicon(href)
    writeFavicon(roundedHref, 'image/png')
  } catch {
    writeFavicon(href)
  }
}
