import type { Profile } from './types'

// TODO: 換成你自己的資料
export const profile: Profile = {
  name: 'Yang Lin-Hsuan',
  headline: 'CS student · create through both design and code',
  avatar: {
    src: '/avatar.jpg', // 把頭貼放進 public/avatar.jpg
    alt: 'avatar of Yang Lin-Hsuan',
    initials: 'YN',
  },
  quote: {
    text: '“Discovery isn’t about finding a new path. It’s about expanding what you’re capable of building.”',
  },
}
