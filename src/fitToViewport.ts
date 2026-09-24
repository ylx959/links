/** 第一屏內容太高時要縮小的比例；放得下就是 1，不放大。 */
export function fitZoom(naturalHeight: number, room: number): number {
  if (naturalHeight <= 0 || room <= 0) return 1
  return Math.min(1, room / naturalHeight)
}

/**
 * 讓 content 在第一屏裡永遠完整可見：先靠 App 的彈性留白吸收，
 * 留白縮到底（reserved）還不夠，才用 zoom 縮整組。zoom 會改變版面高度，transform 不會。
 */
export function fitToViewport(content: HTMLElement, reserved: () => number): () => void {
  const fit = () => {
    content.style.zoom = ''
    const zoom = fitZoom(content.getBoundingClientRect().height, window.innerHeight - reserved())
    content.style.zoom = zoom < 1 ? String(zoom) : ''
  }

  fit()
  // 字型晚到會改變高度，所以除了視窗尺寸也要看內容本身。
  const observer = new ResizeObserver(fit)
  observer.observe(content)
  window.addEventListener('resize', fit)

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', fit)
    content.style.zoom = ''
  }
}
