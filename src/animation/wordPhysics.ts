import Matter from 'matter-js'

/**
 * 掉字用的物理世界。
 *
 * 時間軸決定何時投放與重置單字。世界沒有地板；單字越過底部界線後會從物理世界移除。
 * 左右牆避免旋轉中的單字撐出橫向捲軸。
 *
 * 座標系是 [data-stage]（它是 position: relative）。單字一旦開始掉就變成
 * absolute，於是 offsetParent 正好是 stage，物理算出來的 x/y 可以直接寫成 left/top。
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
  }

  const sync = () => {
    dropped.forEach(({ el, body }) => {
      el.style.left = `${body.position.x}px`
      el.style.top = `${body.position.y}px`
      el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`
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

  /** 把這一批單字丟進世界裡開始掉。 */
  const drop = (words: HTMLElement[]) => {
    const batch = words.filter((el) => !activeElements.has(el))
    if (!batch.length) return

    const origin = stage.getBoundingClientRect()
    // 先量完整批再脫離文件流：一改成 absolute，同一行後面的字就會往前遞補，
    // 那時候量到的就不是它原本待的位置了。
    const bodies = batch.map((el) => {
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
    })

    batch.forEach((el, i) => {
      el.style.position = 'absolute'
      el.style.margin = '0'
      activeElements.add(el)
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
  }

  const destroy = () => {
    reset()
    Matter.Composite.clear(engine.world, false)
    Matter.Engine.clear(engine)
  }

  return { setBounds, drop, settle, reset, destroy }
}
