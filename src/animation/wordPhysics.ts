import Matter from 'matter-js'

/**
 * 掉字用的物理世界。
 *
 * 引擎的手感直接沿用 react-bits 的 FallingText（`npx shadcn add
 * @react-bits/FallingText-TS-CSS`）：restitution 0.8、frictionAir 0.01、friction 0.2、
 * gravity 1，落下時再給一點隨機初速與自旋。那組數字是對的，照抄。
 *
 * 換掉的是「誰決定什麼時候掉」。原元件是一個封閉的小玩具：自己切字、自己置中、
 * 一 mount 就開始掉，而且掉完沒有回頭路 —— 接不到打字機後面，也重來不了。這裡只留
 * 引擎，把觸發權交還給時間軸：什麼時候掉、掉哪一批、什麼時候全部收回去重來，
 * 都由 aboutReveal 那條時間軸說了算。
 *
 * 座標系是 [data-stage]（它是 position: relative）。單字一旦開始掉就變成
 * absolute，於是 offsetParent 正好是 stage，物理算出來的 x/y 可以直接寫成 left/top。
 */

/** 一步固定 1/60 秒。用固定步長而不是真實 delta，慢的機器上不會把字彈穿地板。 */
const STEP = 1000 / 60
/**
 * 「快轉到落定」要跑幾步。
 *
 * 重切行之後如果這一屏本來就該是演完的狀態，不能當著人面重播一次 —— 但物理沒有
 * progress(1) 可以跳。就讓引擎自己空跑十秒份，字自然會堆好，再一次寫回 DOM。
 */
const SETTLE_STEPS = 600

/**
 * 牆再往版面內縮多少。
 *
 * 牆管的是物理的方塊，畫面上看到的是轉了角度的字 —— 一個躺平的字，外接框會比它的
 * 方塊寬出將近半個字高。貼著版面邊緣的牆會讓那半個字探出視窗，整頁多一條橫向捲軸。
 */
const WALL_INSET = 24

/** 給每個單字的初始擾動。完全垂直落下太整齊，看起來像掉格子而不是掉東西。 */
const NUDGE_X = 5
const NUDGE_SPIN = 0.05

export type WordPhysics = ReturnType<typeof createWordPhysics>

export function createWordPhysics(stage: HTMLElement) {
  const engine = Matter.Engine.create({ enableSleeping: true })
  engine.gravity.y = 1

  let walls: Matter.Body[] = []
  let dropped: { el: HTMLElement; body: Matter.Body }[] = []
  let live = new Set<HTMLElement>()
  let frame = 0

  /**
   * 地板與左右牆，座標同樣相對於 stage。
   *
   * 有牆才不用像純補間那樣自己夾範圍：字撞到邊就停在版面裡，不會掉出去把頁面
   * 撐出一條橫向捲軸。
   */
  const setBounds = (edgeL: number, edgeR: number, floor: number) => {
    if (walls.length) Matter.Composite.remove(engine.world, walls)
    const left = edgeL + WALL_INSET
    const right = edgeR - WALL_INSET
    const width = right - left
    const tall = Math.abs(floor) * 2 + 2000
    const opts = { isStatic: true }
    walls = [
      Matter.Bodies.rectangle(left + width / 2, floor + 25, width + 100, 50, opts),
      Matter.Bodies.rectangle(left - 25, floor / 2, 50, tall, opts),
      Matter.Bodies.rectangle(right + 25, floor / 2, 50, tall, opts),
    ]
    Matter.Composite.add(engine.world, walls)
  }

  const sync = () => {
    dropped.forEach(({ el, body }) => {
      el.style.left = `${body.position.x}px`
      el.style.top = `${body.position.y}px`
      el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`
    })
  }

  const tick = () => {
    Matter.Engine.update(engine, STEP)
    sync()
    // 全部睡著就收工。堆好之後每一格都再算一次是純粹的浪費，而這一屏還要留著給人看很久。
    frame = dropped.every((d) => d.body.isSleeping) ? 0 : requestAnimationFrame(tick)
  }

  /** 把這一批單字丟進世界裡開始掉。 */
  const drop = (words: HTMLElement[]) => {
    const batch = words.filter((el) => !live.has(el))
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
      live.add(el)
      dropped.push({ el, body: bodies[i] })
    })
    Matter.Composite.add(engine.world, bodies)
    sync()

    if (!frame) frame = requestAnimationFrame(tick)
  }

  /** 不等真實時間，直接把引擎空跑到字堆好。 */
  const settle = () => {
    for (let i = 0; i < SETTLE_STEPS; i++) Matter.Engine.update(engine, STEP)
    sync()
  }

  /** 全部收回去，DOM 還原成原本排好的樣子。 */
  const reset = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    dropped.forEach(({ el }) => {
      el.style.position = ''
      el.style.margin = ''
      el.style.left = ''
      el.style.top = ''
      el.style.transform = ''
    })
    // keepStatic：牆留著，只清掉字。
    Matter.Composite.clear(engine.world, true)
    dropped = []
    live = new Set()
  }

  const destroy = () => {
    reset()
    Matter.Composite.clear(engine.world, false)
    Matter.Engine.clear(engine)
  }

  return { setBounds, drop, settle, reset, destroy }
}
