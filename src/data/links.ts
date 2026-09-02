import type { LinkGroup, LinkItem } from './types'

// icon 只能填 src/icons/registry.tsx 有註冊的名字。
export const groups: LinkGroup[] = [
  {
    id: 'primary',
    items: [
      { id: 'portfolio', label: 'Portfolio', href: 'https://ylx-studio.com/', icon: 'portfolio' },
      { id: 'github', label: 'Github', href: 'https://github.com/ylx959', icon: 'github' },
      { id: 'linkedin', label: 'Linkedin', href: 'https://www.linkedin.com/in/ylx0421/', icon: 'linkedin' },
    ],
  },
]

/** 只有圖示、排在 copyright 上面。label 會變成螢幕閱讀器與 hover 提示的名稱。 */
export const footerLinks: LinkItem[] = [
  { id: 'email', label: 'Email', href: 'mailto:hello@example.com', icon: 'mail' },
  { id: 'resume', label: 'Résumé', href: '/resume.pdf', icon: 'resume' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/linxuan__0421/', icon: 'instagram' },
]
