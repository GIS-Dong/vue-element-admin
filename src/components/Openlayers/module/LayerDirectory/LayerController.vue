<template>
  <div id="LayerController">
    <el-card v-cardDrag class="box-card">
      <div slot="header" class="clearfix">
        <el-button style="float: left;" icon="el-icon-close" circle size="small" @click="closeWindow" />
        <span>图层管理</span>
        <el-button style="float: right;" icon="el-icon-document" circle size="small" @click="showLayerMenu" />
      </div>
      <div style="overflow:auto;max-height:400px;">
        <el-tree
          ref="tree"
          :data="treeData"
          node-key="id"
          :default-expanded-keys="[1]"
          :props="defaultProps"
          draggable
          :allow-drop="allowDrop"
          @node-drag-end="handleDragEnd"
        >
          <span slot-scope="{ node, data }" class="custom-tree-node">
            <span v-if="!!data.group && data.group == '1'" style="float:left;"><i class="el-icon-tickets" /></span>
            <span
              v-if="!!data.group && data.group == '2' && !data.layerTable"
              style="float:left;"
            ><i class="el-icon-document" /></span>
            <span
              v-if="!!data.group && data.group == '2' && !!data.layerTable"
              style="float:left;"
            ><i class="el-icon-edit-outline" @click="iconClick($event, data)" /></span>
            <span style="float:left;">{{ node.label }}</span>
            <span style="width:80px;float:right;">
              <el-input-number
                v-model="data.opacity"
                size="small"
                :min="0"
                :step="0.1"
                :max="1"
                @change="change(data)"
              />
            </span>
            <span
              v-if="!!data.group && data.group == '2' && data.type == 'geoserver-wfs'"
              style="display:block;position:absolute;right:0px"
            ><i class="el-icon-setting" @click="showStyleMenu(data)" /></span>
          </span>
        </el-tree>
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
import Bus from '@/ShineMap/util/bus.js'

export default {
  props: ['shinemap'],
  data() {
    return {
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      editCheckId: '',
      value8: 2
    }
  },
  computed: {
    treeData() {
      const treeData = this.shinemap.map ? this.shinemap.map.getCheckedLayers() : []
      return JSON.parse(JSON.stringify(treeData))
    }
  },
  methods: {
    treeNodeCheckChange(item, isChecked) {
      if (isChecked == true) {
        // 点击未选中复选框
        this.editCheckId = item.id
        this.$refs.tree.setCheckedKeys([item.id])
        this.addLayer(item)
      } else {
        if (this.editCheckId == item.id) {
          // 点击已选中复选框，保证至少一个选中
          this.$refs.tree.setCheckedKeys([item.id])
        }
      }
    },
    closeWindow() {
      $('#LayerController').hide()
    },
    showLayerMenu() {
      $('#LayerMenu').show()
      $('#LayerController').hide()
    },
    change(data) {
      this.shinemap.layerManager.changeLayerOpacity(data)
    },
    allowDrop(draggingNode, dropNode, type) {
      return type !== 'inner'
    },
    handleDragEnd(draggingNode, dropNode, dropType, ev) {
      // console.log('tree drag end: ', dropNode && dropNode.label, dropType, draggingNode.label);
      if (dropNode && dropType != 'none') {
        this.shinemap.layerManager.changeLayerIndex(draggingNode.data, dropNode.data, dropType)
      }
    },
    iconClick(e, data) {
      const mapSelect = this.shinemap.interactionManager.getInteractionByName('mapSelect')
      const graphicEditing = this.shinemap.interactionManager.getInteractionByName('graphicEditing')
      if (e.currentTarget.className == 'el-icon-edit-outline') {
        if ($('#LayerController .el-icon-edit')) {
          $('#LayerController .el-icon-edit').each(function() {
            $(this).removeClass('el-icon-edit')
            $(this).addClass('el-icon-edit-outline')
          })
        }
        $(e.currentTarget).removeClass('el-icon-edit-outline')
        $(e.currentTarget).addClass('el-icon-edit')
        this.shinemap.map.setCurrentEditLayer(data)
        // 如果选择和编辑功能是打开状态，则重新打开
        if (mapSelect.active) {
          mapSelect.setActive(false)
          mapSelect.setActive(true)
        }
        if (graphicEditing.active) {
          graphicEditing.setActive(false)
          graphicEditing.setActive(true)
        }
      } else {
        $(e.currentTarget).removeClass('el-icon-edit')
        $(e.currentTarget).addClass('el-icon-edit-outline')
        this.shinemap.map.clearCurrentEditLayer()
        // 如果选择功能是打开状态，则重新打开
        if (mapSelect.active) {
          mapSelect.setActive(false)
          mapSelect.setActive(true)
        }
        // 如果编辑功能是打开状态，则关闭
        if (graphicEditing.active) {
          graphicEditing.setActive(false)
        }
      }
    },
    showStyleMenu(data) {
      if ($('#StyleMenu').css('display') == 'none') Bus.$emit('setLayerStyle', data)
      $('#StyleMenu').css('display', 'block')
    }
  }
}
</script>

<style scoped>
#LayerController {
  position: absolute;
  min-width: 240px;
  max-width: 400px;
  max-height: 100px;
  top: 50px;
  left: 12%;
  z-index: 999;
  /* display: none; */
}
#LayerController > .box-card > .el-card__header {
  padding: 8px 20px;
}
#LayerController .custom-tree-node {
  flex: 1;
  display: block;
  align-items: center;
  font-size: 14px;
  padding-right: 20px;
}
.el-input-number--mini {
  width: 70px;
  line-height: 18px;
}
.el-input-number--mini .el-input__inner {
  padding-left: 25px;
  padding-right: 25px;
}
.el-input--mini .el-input__inner {
  height: 20px;
  line-height: 20px;
}
.el-input-number--mini .el-input-number__increase {
  width: 20px;
}
.el-input-number--mini .el-input-number__decrease {
  width: 20px;
}
</style>
