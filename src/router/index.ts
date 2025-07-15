import { createRouter, createWebHistory } from 'vue-router'
import GlobalDashboard from '../components/GlobalDashboard.vue'
import WordList from '../components/WordList.vue'
import RupeeList from '../components/RupeeList.vue'
// import SentenceEditor from '../components/SentenceEditor.vue'
// import Settings from '../components/Settings.vue'


export const routeDefinitions = [
  {
    path: '/',
    props: true,
    component: GlobalDashboard,
    meta: { navigationLabel: 'Dashboard' }
  },
  {
    path: '/rupees',
    props: true,
    component: RupeeList,
    meta: { navigationLabel: 'Rupees' }
  },
  {
    path: '/words',
    props: true,
    component: WordList,
    meta: { navigationLabel: 'Words' }
  },
  // {
  //   path: '/sentences',
  //   component: SentenceEditor,
  //   props: true,
  //   meta: { navigationLabel: 'Sentences' }
  // },
  // {
  //   path: '/settings',
  //   component: Settings,
  //   meta: { navigationLabel: 'Settings' }
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routeDefinitions,
})

export default router
