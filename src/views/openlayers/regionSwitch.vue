<template>
  <div class="map-container">
    <olMap :zoom="zoom" :center="center" :xzq-bar-show="true" @mapInitialized="mapInitialized" />
    <!-- <region-selects
      v-model="region"
      :town="true"
      class="regionControl"
      @change="regionChange"
    /> -->
    <!-- <v-distpicker class="regionControl" province="广东省" city="广州市" area="海珠区" /> -->
  </div>
</template>

<script>
import $ from 'jquery'
import VDistpicker from 'v-distpicker'
import { RegionSelects } from 'v-region'
import olMap from '@/components/Openlayers'
import Bus from '@/components/Openlayers/util/bus'

export default {
  name: 'KeyboardChart',
  components: { olMap, RegionSelects, VDistpicker },
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
      setTimeout(() => {
        Bus.$emit('user_xzqdm', '330100')
      }, 1111)
    },
    regionChange(data) {
      // setTimeout(() => {
      //   $('.regionControl').find('div:first-child').css('display', 'none')
      // }, 1000)
      if (data.town) {
        console.log(data.town)
      } else if (data.area) {
        console.log(data.area)
      } else if (data.city) {
        console.log(data.city)
      } else if (data.province) {
        console.log(data.province)
      }
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
.regionControl{
  position: absolute;
  top: 10px;
  left: 10px;
  background: lightblue;
}
.regionControl:first-child{
  display: none;
}
</style>

