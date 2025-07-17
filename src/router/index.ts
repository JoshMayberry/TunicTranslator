import { createRouter, createWebHistory } from 'vue-router'
import GlobalDashboard from '../components/GlobalDashboard.vue'
import SentenceViewer from '../components/SentenceViewer.vue'
import SoundList from '../components/SoundList.vue'
import SentenceList from '../components/SentenceList.vue'


export const routeDefinitions = [
  {
    path: '/',
    props: true,
    component: GlobalDashboard,
    meta: { navigationLabel: 'Dashboard' }
  },
  {
    path: '/sound-list',
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
    component: SentenceViewer,
    meta: { navigationLabel: 'Viewer' }
  },
  {
    path: '/settings',
    component: SentenceViewer,
    meta: { navigationLabel: 'Settings' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routeDefinitions,
})

export default router
