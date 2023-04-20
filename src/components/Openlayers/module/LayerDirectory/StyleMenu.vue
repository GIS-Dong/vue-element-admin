<template>
  <div id="StyleMenu">
    <el-card v-cardDrag class="box-card">
      <div slot="header" class="clearfix">
        <el-button style="float: right;" icon="el-icon-close" circle size="small" @click="closeWindow" />
        <span>图层样式</span>
      </div>
      <div>
        <el-form ref="form" :model="form" label-width="80px">
          <el-form-item label="边框样式">
            <el-radio-group v-model="form.borderStyle">
              <el-radio :label="1">实线</el-radio>
              <el-radio :label="2">虚线</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="边框宽度">
            <el-input-number v-model="form.borderWidth" size="small" :min="0" />
          </el-form-item>
          <el-form-item label="边框颜色">
            <el-color-picker
              v-model="form.borderColor"
              size="small"
              show-alpha
              :predefine="predefineColors"
              @active-change="selectBorderColor"
            />
          </el-form-item>
          <!-- <el-form-item label="填充样式">
						<el-radio-group v-model="form.fillStyle">
							<el-radio :label="1">铺满</el-radio>
							<el-radio :label="2">斜线</el-radio>
						</el-radio-group>
          </el-form-item>-->
          <el-form-item label="填充颜色">
            <el-color-picker
              v-model="form.fillColor"
              size="small"
              show-alpha
              :predefine="predefineColors"
              @active-change="selectFillColor"
            />
          </el-form-item>
        </el-form>
        <div style="padding:5px">
          <el-button size="small" type="warning" @click="resetStyle">还原</el-button>
          <el-button size="small" type="primary" @click="onSubmit($event)">确定</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
import store from '../../../../store/index'
import Bus from '@/ShineMap/util/bus.js'
import { Fill, Stroke, Style } from 'ol/style.js'

export default {
  props: ['shinemap'],
  data() {
    return {
      form: {
        borderStyle: 1,
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 0, 0.68)',
        fillStyle: 1,
        fillColor: '#c7158577'
      },
      predefineColors: [
        'rgb(255, 255, 255)',
        '#ff4500',
        '#ff8c00',
        '#ffd700',
        '#90ee90',
        '#00ced1',
        '#1e90ff',
        '#c71585',
        'rgba(255, 69, 0, 0.68)',
        'rgb(255, 120, 0)',
        'hsv(51, 100, 98)',
        'hsva(120, 40, 94, 0.5)',
        'hsl(181, 100%, 37%)',
        'hsla(209, 100%, 56%, 0.73)',
        '#c7158577'
      ]
    }
  },
  mounted() {
    this.$watch(
      'form',
      (newValue, oldValue) => {
        this.onSubmit()
      },
      {
        deep: true
      }
    )
    Bus.$on('setLayerStyle', data => {
      // 获取图层样式
      this.targetLayer = this.shinemap.map.getLayerById(data.id)
      this.setMenuStyle()
    })
  },
  methods: {
    selectBorderColor(color) {
      this.form.borderColor = color
    },
    selectFillColor(color) {
      this.form.fillColor = color
    },
    setMenuStyle() {
      const layerStyleFunction = this.targetLayer.getStyleFunction()
      const layerStyle = layerStyleFunction()[0]
      // 获取图层填充样式
      const fill = layerStyle.getFill()
      // 获取图层边框样式
      const stroke = layerStyle.getStroke()
      this.setStrokeInMenu(stroke)
      this.setFillInMenu(fill)
    },
    setStrokeInMenu(style) {
      const lineDash = style.getLineDash()
      const width = style.getWidth()
      const color = style.getColor()
      this.form.borderColor = color
      this.form.borderWidth = width
      this.form.borderStyle = lineDash ? 2 : 1
    },
    setFillInMenu(style) {
      const color = style.getColor()
      this.form.fillColor = color
    },
    onSubmit(event) {
      const fill = new Fill({
        color: this.form.fillColor
      })
      const stroke = new Stroke({
        color: this.form.borderColor,
        width: this.form.borderWidth,
        lineDash: this.form.borderStyle == 2 ? [1, 2, 3, 4, 5, 6] : undefined
      })
      const style = new Style({
        fill: fill,
        stroke: stroke
      })
      this.targetLayer.setStyle(style)
      if (event) {
        $('#StyleMenu').css('display', 'none')
      }
    },
    resetStyle() {
      // 设置图层默认样式
      this.targetLayer.setStyle()
      // 设置面板
      this.setMenuStyle()
      // $("#StyleMenu").css("display","none");
    },
    closeWindow() {
      $('#StyleMenu').css('display', 'none')
    }
  }
}
</script>
<style scoped>
#StyleMenu {
  position: absolute;
  width: 240px;
  /*	    max-width: 400px;*/
  max-height: 100px;
  top: 50px;
  right: 12%;
  z-index: 999;
  display: none;
}
#StyleMenu > .box-card > .el-card__header {
  padding: 8px 20px;
}
#StyleMenu > .box-card > .el-card__body {
  padding: 0px;
}
.collapseItem {
  display: block;
  height: 30px;
  padding: 3px;
}
</style>
