<template>
  <div class="layer-pop">
    <div class="layer-items clearfix">
      <a id="vec_type" :class="{ active: activeType == 'vec' }" href="javascript:void(0);" @click="changeLayer('vec')">
        <!-- <div class="switch-box">
          <input v-model="vecNoteChecked" type="checkbox" class="switch" @click="noteClick" />
          <p @click="noteClick">开启注记</p>
        </div>-->
        <img
          src="data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4QN6aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZmQ3YzFkY2ItN2ZkNC1kZDQ1LTk2MGItN2QyODdhN2MxNTU2IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjgxMTFDMzE4NzY3QzExRTNCRUFDRkE5NjhFNjNGNEUzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjgxMTFDMzE3NzY3QzExRTNCRUFDRkE5NjhFNjNGNEUzIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5ZGJmNjY2ZS0wMmZjLTI0NGItODIzMC04Y2RmZDg3ZDk1MWQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZmQ3YzFkY2ItN2ZkNC1kZDQ1LTk2MGItN2QyODdhN2MxNTU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3Jk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"
        >
        <span>地图</span>
      </a>
      <a
        id="img_type"
        :class="{ active: activeType == 'img' }"
        href="javascript:void(0);"
        style="margin: 0 13px"
        @click="changeLayer('img')"
      >
        <!-- <div class="switch-box">
          <input v-model="imgNoteChecked" type="checkbox" class="switch" @click="noteClick" />
          <p @click="noteClick">开启注记</p>
        </div>-->
        <img
          src="data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4QN6aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZmQ3YzFkY2ItN2ZkNC1kZDQ1LTk2MGItN2QyODdhN2MxNTU2IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjgxMTFDMzE0NzY3QzExRTNCRUFDRkE5NjhFNjNGNEUzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjgxMTFDMzEzNzY3QzExRTNCRUFDRkE5NjhFNjNGNEUzIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5ZGJmNjY2ZS0wMmZjLTI0NGItODIzMC04Y2RmZDg3ZDk1MWQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZmQ3YzFkY2ItN2ZkNC1kZDQ1LTk2MGItN2QyODdhN2MxNTU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3Jk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"
        >
        <span>影像</span>
      </a>
    </div>
  </div>
</template>

<script>
import Config from '@/services/config'
export default {
  props: {
    shinemap: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      activeType: '',
      vecNoteChecked: true,
      imgNoteChecked: true,
      terNoteChecked: true,
      tk: undefined
    }
  },
  computed: {
    layersInfo: function() {
      return {
        vec: {
          id: 'cbopd126-609b-loba-3ecc-ea3djk88ccc4',
          label: '全球矢量地图服务',
          type: 'tdt_offLine',
          url: `${Config.tdtUrl}/mapabc/roadmap/{z}/{x}/{y}.png`,
          visibleLayers: ['vec'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        },
        img: {
          id: 'cbd0dd26-609b-b9ba-3ecc-ealom98dccc4',
          label: '全球影像地图服务',
          type: 'tdt_offLine',
          url: `${Config.tdtUrl}/mapabc/satellite/{z}/{x}/{y}.jpg`,
          visibleLayers: ['img'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        }
      }
    },

    noteLayerInfo: function() {
      return {
        img: {
          id: 'cbd0d126-6ddb-b9ba-ddcc-ea3a3128ccc4',
          label: '全球影像注记服务',
          type: 'tdt_offLine',
          url: `${Config.tdtUrl}/mapabc/overlay/{z}/{x}/{y}.png`,
          visibleLayers: ['cia'],
          mapIndex: 0.5,
          opacity: 1,
          group: 1
        }
      }
    }
  },
  watch: {
    activeType(newValue, oldValue) {
      // 添加图层
      this.shinemap.addTargetLayer(this.getTDTLayerInfo(newValue))
      if (newValue === 'img') {
        if (this[newValue + 'NoteChecked']) {
          this.shinemap.addTargetLayer(this.getTDTNotelayerInfo(newValue))
        }
      }
      // 删除之前的图层
      if (oldValue) {
        this.shinemap.removeTargetLayer(this.getTDTLayerInfo(oldValue))
        // 注记图层删除
        if (oldValue === 'img') {
          if (this[oldValue + 'NoteChecked']) {
            this.shinemap.removeTargetLayer(this.getTDTNotelayerInfo(oldValue))
          }
        }
      }
    },
    vecNoteChecked(newValue) {
      if (this.activeType === 'vec') {
        if (newValue) {
          this.shinemap.addTargetLayer(this.getTDTNotelayerInfo('vec'))
        } else {
          this.shinemap.removeTargetLayer(this.getTDTNotelayerInfo('vec'))
        }
      }
    },
    imgNoteChecked(newValue) {
      if (this.activeType === 'img') {
        if (newValue) {
          this.shinemap.addTargetLayer(this.getTDTNotelayerInfo('img'))
        } else {
          this.shinemap.removeTargetLayer(this.getTDTNotelayerInfo('img'))
        }
      }
    },
    terNoteChecked(newValue) {
      if (this.activeType === 'ter') {
        if (newValue) {
          this.shinemap.addTargetLayer(this.getTDTNotelayerInfo('ter'))
        } else {
          this.shinemap.removeTargetLayer(this.getTDTNotelayerInfo('ter'))
        }
      }
    }
  },
  mounted() {
    this.tk = this.shinemap.get('tdtKey')
    this.vecNoteChecked = this.shinemap.get('tdtNoteActive')
    this.imgNoteChecked = this.shinemap.get('tdtNoteActive')
    this.terNoteChecked = this.shinemap.get('tdtNoteActive')
    this.activeType = this.shinemap.get('tdtActiveType')
  },
  methods: {
    /**
     * 阻止事件下沉
     */
    noteClick(e) {
      e.stopPropagation()
    },
    changeLayer(type) {
      this.activeType = type
      const zoom = this.shinemap.getView().getZoom()
      setTimeout(() => {
        this.shinemap.getView().setMaxZoom(20)
        this.shinemap.getView().setZoom(zoom)
      }, 500)
    },
    /**
     * 获取天地图图层配置信息
     */
    getTDTLayerInfo(type) {
      return this.layersInfo[type]
    },
    /**
     * 获取天地图注记图层配置信息
     */
    getTDTNotelayerInfo(type) {
      return this.noteLayerInfo[type]
    }
  }
}
</script>

<style scoped>
.layer-pop {
  position: absolute;
  z-index: 2;
  right: -100px;
  bottom: 0.5em;
  background: #fff;
  border-radius: 3px;
  width: auto;
  font-size: 13px;
  padding: 5px 13px 2px 9px;
}
.layer-pop:hover {
  transform: translateX(-100px);
}
.layer-pop .layer-items {
  margin: 0;
  width: auto;
  height: auto;
}
.layer-pop a.active {
  color: #337fe5;
}
.layer-pop .layer-items a {
  width: 72px;
  float: left;
  text-align: center;
  color: #333;
}
a {
  text-decoration: none;
}

.layer-pop .layer-items a img {
  border: 2px solid transparent;
  border-radius: 3px;
}
.layer-pop a.active img {
  border: 2px solid #337fe5;
}
.layer-items img {
  width: 74px;
  height: 54px;
}
.layer-pop .layer-items a {
  position: relative;
}
.layer-pop .layer-items a div:hover + img {
  border: 2px solid #00bb00;
}
.layer-pop .layer-items a img:hover {
  border: 2px solid #00bb00;
}
.layer-pop .layer-items a span {
  position: absolute;
  bottom: 0;
  right: 0;
  display: inline-block;
  padding: 2px;
  margin: 3px 0px 10px 4px;
  font-size: 12px;
  line-height: 12px;
  color: #fff;
  border-top-left-radius: 2px;
  background-color: #337fe5;
}
.layer-pop .layer-items a span {
  pointer-events: none;
}
.layer-pop .switch-box {
  display: none;
  position: absolute;
  top: 3px;
  left: 3px;
  width: 100%;
  height: 20px;
  line-height: 22px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  font-size: 12px;
}
.layer-pop .switch-box input.switch {
  position: absolute;
  top: 1px;
  cursor: pointer;
}
.layer-pop .switch-box p {
  display: inline-block;
  margin: 0 0 0 20px;
}
.layer-pop .layer-items a:hover .switch-box {
  display: block;
}
</style>
