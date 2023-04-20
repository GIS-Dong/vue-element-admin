import Event from 'ol/events/Event.js'

class DrillEvent extends Event {
  constructor(type, map, regionCode, regionName) {
    super(type)
    this.map = map
    this.regionCode = regionCode
    this.regionName = regionName
  }
}

export default DrillEvent
