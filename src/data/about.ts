import type { About } from './types'

export const about: About = {
  heading: 'About me.',
  // 一段一段自己接上去演。除了最後一段，每一段講完都會掉到畫面底部堆著。
  //
  // 每一段都盡量短。理由有兩個：一是整段是一次浮出來的，長句會讓下一段等太久；
  // 二是講完的字會變成地上那堆東西 —— 字愈多堆愈高，高到蓋掉還沒講完的那一段。
  paragraphs: [
    'Designer? Developer? Engineer? Artist? I’ve been called all of them — haha. I don’t care much about the title. I just love making things: a website, a piece of code, a space, a visual.',
    'Sometimes it works. Sometimes it breaks. Sometimes I realize I’ve been doing it wrong for three hours — honestly, that’s my favorite part.',
    'I don’t want to stick to one thing either. I started in architecture, found my way into programming, and design was always part of how I work. Different worlds. I like moving between them.',
    'I’m still figuring out what exactly I am. For now: someone who gets curious, and makes stuff.',
  ],
}
