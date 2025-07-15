<template>
  <mcw-tab-bar
    :active-tab-index="activeTabIndex"
    @update:modelValue="onTabChange"
  >
    <mcw-tab v-for="(tab, i) in navTabs" :key="i">
      <span class="mdc-tab__text-label">{{ tab.label }}</span>
    </mcw-tab>
  </mcw-tab-bar>
</template>

<script lang="ts">
import { routeDefinitions } from '../router'

export default {
  name: 'NavigationTabs',
  data() {
    return {
      activeTabIndex: 0
    }
  },
  computed: {
    navTabs() {
      return routeDefinitions
        .filter(r => r.meta?.navigationLabel)
        .map(r => ({
          label: r.meta.navigationLabel,
          path: r.path
        }))
    }
  },
  watch: {
    $route(to) {
      const idx = this.navTabs.findIndex(t => to.path.startsWith(t.path))
      this.activeTabIndex = idx >= 0 ? idx : 0
    }
  },
  created() {
    const idx = this.navTabs.findIndex(t =>
      this.$route.path.startsWith(t.path)
    )
    this.activeTabIndex = idx >= 0 ? idx : 0
  },
  methods: {
    onTabChange(index: any) {
      const path = this.navTabs[index].path
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
    }
  }
}
</script>
