<template>
  <div class="map-container">
    <olMap />
  </div>
</template>

<script>
import olMap from '@/components/Openlayers'

export default {
  name: 'KeyboardChart',
  components: { olMap },
  data() {
    return {
      map: undefined,
      center: [120.1478, 30.2619],
      zoom: 12,
      region: {
        province: '330000',
        city: '330100',
        area: '330106',
        town: '330106013'
      }
    }
  },
  mounted() {

  },
  methods: {
    mapInitialized(map) {
      this.map = map
    }
  }
}
</script>

<style scoped>
.map-container{
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
}
</style>

