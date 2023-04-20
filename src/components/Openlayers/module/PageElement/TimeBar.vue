<template>
  <div class="timeBar">
    <div class="playOrPause" :class="{ play: !isPlay, pause: isPlay }" :title="playTitle" @click="playOrPause" />
    <div class="stopPlay" title="停止" @click="stop" />
    <div class="processBox">
      <div class="playedArea" :style="{ width: process + '%' }" />
      <div class="notPlayedArea" :style="{ width: 100 - process + '%' }" />
      <div class="ticktBox">
        <div class="trackStartTime">{{ startTime }}</div>
        <div class="trackEndTime">{{ endTime }}</div>
      </div>
    </div>
    <div class="moreControl" title="更多">
      <span>...</span>
    </div>
  </div>
</template>

<script>
import Map from 'ol/Map.js'
import TrackEvent from '../Track/event/TrackEvent'

export default {
  props: {
    shinemap: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  data() {
    return {
      active: false,
      isPlay: false,
      playTitle: '开始',
      startTime: '',
      endTime: '',
      process: 0
    }
  },
  watch: {
    shinemap() {
      this.registEvent()
    },
    isPlay(newValue) {
      if (newValue) {
        this.playTitle = '暂停'
      } else {
        this.playTitle = '开始'
      }
    }
  },
  mounted() {
    if (this.shinemap instanceof Map) {
      this.registEvent()
    }
  },
  methods: {
    registEvent() {
      this.shinemap.on('trackPlayback_ready', event => {
        const startTime = new Date(Number(event.data.start))
        const endTime = new Date(Number(event.data.end))
        this.startTime = `${startTime.getFullYear()}-${startTime.getMonth() + 1}-${startTime.getDate()}
          ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()}`
        this.endTime = `${endTime.getFullYear()}-${endTime.getMonth() + 1}-${endTime.getDate()}
          ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()}`
      })
      this.shinemap.on('trackPlayback_process', event => {
        this.process = event.data * 100
      })
      this.shinemap.on('trackPlayback_start', () => {
        this.active = true
        this.isPlay = true
      })
      this.shinemap.on('trackPlayback_end', () => {
        this.isPlay = false
      })
    },
    playOrPause() {
      if (!this.active) {
        return
      }
      if (this.isPlay) {
        this.shinemap.dispatchEvent(new TrackEvent('timeBar_playStatus', 'pause'))
      } else {
        this.shinemap.dispatchEvent(new TrackEvent('timeBar_playStatus', 'play'))
      }
      this.isPlay = !this.isPlay
    },
    stop() {
      this.isPlay = false
      this.process = 0
      this.shinemap.dispatchEvent(new TrackEvent('timeBar_playStatus', 'stop'))
    }
  }
}
</script>

<style lang="scss" scoped>
.timeBar {
  height: 36px;
  width: 100%;
  background-color: #374a61;
  border-top: solid 1px #2d384a;
  border-bottom: solid 1px #2d384a;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  font-size: 100%;
  vertical-align: baseline;

  .playOrPause {
    float: left;
    height: 24px;
    width: 24px;
    margin: 6px 6px 6px 12px;

    &:hover {
      background-position: 0 -24px;
    }

    &:active {
      background-position: 0 -48px;
    }
  }

  .play {
    cursor: pointer;
    background: url('../../assets/images/play.png') no-repeat;
  }

  .pause {
    cursor: pointer;
    background: url('../../assets/images/pause.png') no-repeat;
  }

  .stopPlay {
    float: left;
    height: 24px;
    width: 24px;
    margin: 6px 12px 6px 6px;
    cursor: pointer;
    background: url('../../assets/images/stop.png') no-repeat;

    &:hover {
      background-position: 0 -24px;
    }

    &:active {
      background-position: 0 -48px;
    }
  }

  .processBox {
    float: left;
    height: 36px;
    width: calc(100% - 120px);

    .playedArea {
      float: left;
      height: 36px;
      background-color: #2d76ab;
    }

    .notPlayedArea {
      float: left;
      height: 36px;
      background-color: #242a36;
    }

    .ticktBox {
      position: absolute;
      width: calc(100% - 120px);
      height: 36px;
      color: #d0dce8;

      .trackStartTime {
        position: absolute;
        left: 0px;
        height: 36px;
        line-height: 36px;
        margin: 0 0 0 5px;
      }

      .trackEndTime {
        position: absolute;
        right: 0px;
        height: 36px;
        line-height: 36px;
        margin: 0 5px 0 0;
      }
    }
  }

  .moreControl {
    float: right;
    width: 24px;
    height: 24px;
    line-height: 24px;
    overflow: hidden;
    margin: 5px 8px 0 0;
    border: solid 1px #354157;
    background-color: #354157;
    cursor: pointer;
    color: #fff;
    text-align: center;
    font-size: 16px;
    font-weight: 700;

    &:hover {
      color: #88d6fb;
      border: solid 1px #172b44;
    }

    &:active {
      color: #0e2ca2;
    }
  }
}
</style>
