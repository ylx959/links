import Matter from 'matter-js'

/**
 * 掉字用的物理世界。
 *
 * 時間軸決定何時投放與重置單字。世界沒有地板；單字越過底部界線後會從物理世界移除。
 * 左右牆避免旋轉中的單字撐出橫向捲軸。
 *
 * 座標系是 [data-stage]（它是 position: relative）。單字一旦開始掉就變成 absolute
 * 並釘死在原點，位置與角度全部由 transform 表達 —— 於是每幀只重繪、不重排。
 */

/** 固定步長保持不同幀率下的物理結果一致。 */
const STEP = 1000 / 60
/**
 * 「快轉到掉完」最多跑幾步。
 *
 * 重切行後用固定步數快進到結束；上限避免異常碰撞造成無限循環。
 */
const SETTLE_STEPS = 600

/**
 * 牆再往版面內縮多少。
 *
 * 為旋轉後超出物理方塊的文字保留水平空間。
 */
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
  /**
   * 已經量好、建好 body，但還沒放手的字。
   *
   * 量位置要 getBoundingClientRect，那是一次強制同步回流。放手那一幀是 GSAP 的
   * tl.call() 叫起來的 —— 筆畫和透明度剛寫完，文件是髒的，這時候一讀就得等整頁
   * 重算，而一整段的字是同時放手的。那一幀於是被撐爆，看起來就是散開的瞬間打嗝。
   *
   * 所以量測與建 body 全部提前到版面靜止時做完，放手那一幀只剩「把現成的 body
   * 丟進世界」—— 沒有讀，就沒有回流。
   */
  const pending = new Map<HTMLElement, Matter.Body>()
  let frame = 0
  /** 越過這條線（相對 stage）就算掉出畫面了。 */
  let cullY = Infinity

  /**
   * 左右牆與「掉出去」的界線，座標同樣相對於 stage。
   *
   * 有牆才不用像純補間那樣自己夾範圍：字撞到邊就滑回版面裡，不會掉出去把頁面
   * 撐出一條橫向捲軸。
   */
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
      // 只寫 transform。改 left/top 每次都是一次重排，一段四五十個字、每幀重排一次，
      // 掉落全程都在跟版面引擎拔河；transform 只走合成與繪製。
      // 字釘在 stage 原點（left/top 都是 0），位移由前面那個 translate 補上，
      // 後面的 -50% 把錨點挪到方塊中心 —— 那才是 body.position 的意思。
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

  /**
   * 先量好、先建好，但先不放進世界。
   *
   * 挑版面靜止、沒有動畫在跑的時候呼叫（歸零之後），把放手那一幀的工作預先清空。
   * 已經量過或已經在掉的字會被跳過，所以重複呼叫是免費的 —— 沒有東西要量時，
   * 連 stage 的那一次 getBoundingClientRect 都不會發生。
   */
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
    // 掉出去的那些已經不在 dropped 裡了，但 style 還留在它們身上 —— 所以清的是
    // 「這一輪碰過的每一個字」，不是「現在還在掉的那些」。
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
