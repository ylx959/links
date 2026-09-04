import Matter from 'matter-js'

/** 無地板的掉字物理世界；牆限制橫向溢出，transform 負責相對 stage 的每幀位移。 */

/** 固定步長保持不同幀率下的物理結果一致。 */
const STEP = 1000 / 60
/** 重切行後快轉到掉完的步數上限，避免異常碰撞造成無限循環。 */
const SETTLE_STEPS = 600

/** 牆向內縮的距離，為旋轉文字保留水平空間。 */
const WALL_INSET = 24

/** 給每個單字的初始擾動。完全垂直落下太整齊，看起來像掉格子而不是掉東西。 */
const NUDGE_X = 5
const NUDGE_SPIN = 0.05

export function createWordPhysics(stage: HTMLElement) {
  const engine = Matter.Engine.create()
  engine.gravity.y = 0.6

  let walls: Matter.Body[] = []
  let dropped: { el: HTMLElement; body: Matter.Body }[] = []
  const activeElements = new Set<HTMLElement>()
  /** 預先量好但尚未投放的 body，避免投放當幀讀取 DOM 造成強制回流。 */
  const pending = new Map<HTMLElement, Matter.Body>()
  let frame = 0
  /** 越過這條線（相對 stage）就算掉出畫面了。 */
  let cullY = Infinity

  /** 設定相對 stage 的左右牆與移除界線，防止文字撐出橫向捲軸。 */
  const setBounds = (edgeL: number, edgeR: number, cull: number) => {
    if (walls.length) Matter.Composite.remove(engine.world, walls)
    const left = edgeL + WALL_INSET
    const right = edgeR - WALL_INSET
    // 牆延伸到界線以下，避免單字在被移除前從側邊逸出。
    const tall = Math.abs(cull) * 2 + 2000
    const opts = { isStatic: true }
    walls = [
      Matter.Bodies.rectangle(left - 25, cull / 2, 50, tall, opts),
      Matter.Bodies.rectangle(right + 25, cull / 2, 50, tall, opts),
    ]
    Matter.Composite.add(engine.world, walls)
    cullY = cull
    // 預量的字位是照這組邊界所屬的那份版面量的；邊界重量代表版面變了，舊的一律作廢。
    pending.clear()
  }

  const sync = () => {
    dropped.forEach(({ el, body }) => {
      // 只寫 transform 以免重排；translate(-50%) 讓錨點對齊 body 中心。
      el.style.transform =
        `translate(${body.position.x}px, ${body.position.y}px)` +
        ` translate(-50%, -50%) rotate(${body.angle}rad)`
    })
  }

  /** 整個掉到界線以下的字：從世界撤掉、藏起來，之後不再同步。 */
  const cull = () => {
    const gone = dropped.filter(({ body }) => body.bounds.min.y > cullY)
    if (!gone.length) return
    gone.forEach(({ el, body }) => {
      Matter.Composite.remove(engine.world, body)
      // 留在原地的話，這個絕對定位的元素會把文件底部往下撐。
      el.style.visibility = 'hidden'
    })
    dropped = dropped.filter(({ body }) => body.bounds.min.y <= cullY)
  }

  const tick = () => {
    Matter.Engine.update(engine, STEP)
    sync()
    cull()
    // 全部掉出去就收工 —— 沒有地板，字不會停下來，只會消失。
    frame = dropped.length ? requestAnimationFrame(tick) : 0
  }

  /** 以 stage 左上為原點，把一個字量成一塊矩形剛體。 */
  const makeBody = (el: HTMLElement, origin: DOMRect) => {
    const r = el.getBoundingClientRect()
    const body = Matter.Bodies.rectangle(
      r.left - origin.left + r.width / 2,
      r.top - origin.top + r.height / 2,
      r.width,
      r.height,
      { restitution: 0.8, frictionAir: 0.01, friction: 0.2 },
    )
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * NUDGE_X, y: 0 })
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * NUDGE_SPIN)
    return body
  }

  /** 在版面靜止時預建 body；已量過或正在掉落的字會跳過。 */
  const prime = (words: HTMLElement[]) => {
    const batch = words.filter((el) => !activeElements.has(el) && !pending.has(el))
    if (!batch.length) return
    const origin = stage.getBoundingClientRect()
    batch.forEach((el) => pending.set(el, makeBody(el, origin)))
  }

  /** 把這一批單字丟進世界裡開始掉。 */
  const drop = (words: HTMLElement[]) => {
    const batch = words.filter((el) => !activeElements.has(el))
    if (!batch.length) return

    // 正常情況下 prime 早就跑完了，這裡是不做事、也不讀 DOM 的 no-op。
    // 只有時間軸被快轉、來不及預量時，才真的在這一幀補量。
    prime(batch)

    const bodies = batch.map((el) => pending.get(el)!)
    batch.forEach((el, i) => {
      el.style.position = 'absolute'
      // 位置整個交給 transform，所以錨點固定在 stage 原點。
      el.style.left = '0'
      el.style.top = '0'
      el.style.margin = '0'
      activeElements.add(el)
      pending.delete(el)
      dropped.push({ el, body: bodies[i] })
    })
    Matter.Composite.add(engine.world, bodies)
    sync()

    if (!frame) frame = requestAnimationFrame(tick)
  }

  /** 不等真實時間，直接把引擎空跑到字都掉出去。 */
  const settle = () => {
    for (let i = 0; i < SETTLE_STEPS && dropped.length; i++) {
      Matter.Engine.update(engine, STEP)
      cull()
    }
    sync()
  }

  /** 全部收回去，DOM 還原成原本排好的樣子。 */
  const reset = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    // 清除本輪所有碰過的字，包括已離開 dropped 的元素。
    activeElements.forEach((el) => {
      el.style.position = ''
      el.style.margin = ''
      el.style.left = ''
      el.style.top = ''
      el.style.transform = ''
      el.style.visibility = ''
    })
    // keepStatic：牆留著，只清掉字。
    Matter.Composite.clear(engine.world, true)
    dropped = []
    activeElements.clear()
    // 字剛被放回文件流，還沒重新量過 —— 預量的那批留著只會是舊的。
    pending.clear()
  }

  const destroy = () => {
    reset()
    Matter.Composite.clear(engine.world, false)
    Matter.Engine.clear(engine)
  }

  return { setBounds, prime, drop, settle, reset, destroy }
}
