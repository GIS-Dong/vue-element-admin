import Event from 'ol/events/Event.js'

class TrackEvent extends Event {
  constructor(type, data) {
    super(type)
    this.data = data
  }
}

export default TrackEvent
