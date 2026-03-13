export interface CatalogApp {
  id: string
  name: string
  version: string
  category: string
  description: string
  icon: string
  url: string
}

export const catalogApps: CatalogApp[] = [
  {
    id: 'docs',
    name: 'docs',
    version: '1.0.0',
    category: 'utilities',
    description: 'springra1n docs and help page.',
    icon: '📚',
    url: 'https://example.com',
  },
  {
    id: 'weather',
    name: 'weather',
    version: '1.2.0',
    category: 'widgets',
    description: 'simple web weather app.',
    icon: '☁️',
    url: 'https://example.com',
  },
  {
    id: 'livecontainer-installer',
    name: 'livecontainer installer',
    version: '0.1.0',
    category: 'sideload',
    description: 'handoff into livecontainer via url scheme.',
    icon: '📲',
    url: 'livecontainer://',
  },
]

