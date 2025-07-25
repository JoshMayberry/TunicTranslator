import { createRouter, createWebHistory } from 'vue-router'
import GlobalDashboard from '../components/GlobalDashboard.vue'
import SentenceViewer from '../components/SentenceViewer.vue'
import SoundList from '../components/SoundList.vue'
import Settings from '../components/Settings.vue'
import SentenceList from '../components/SentenceList.vue'
import Transfer from '../components/Transfer.vue'


export const routeDefinitions = [
  {
    path: '/',
    props: true,
    component: GlobalDashboard,
    meta: { navigationLabel: 'Dashboard' }
  },
  {
    path: '/sound-list/:id?',
    pathBase: '/sound-list',
    component: SoundList,
    meta: { navigationLabel: 'Sounds' }
  },
  {
    path: '/sentence-list',
    component: SentenceList,
    meta: { navigationLabel: 'Sentences' }
  },
  {
    path: '/sentence-viewer/:id?',
    pathBase: '/sentence-viewer',
    component: SentenceViewer,
    meta: { navigationLabel: 'Viewer' }
  },
  {
    path: '/settings',
    component: Settings,
    meta: { navigationLabel: 'Settings' }
  },
  {
    path: '/transfer',
    component: Transfer,
    meta: { navigationLabel: 'Transfer' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routeDefinitions,
})

export default router
