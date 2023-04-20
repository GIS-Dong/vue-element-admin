import Event from 'ol/events/Event.js'

class IdentifyEvent extends Event {
  constructor(type, identifyed, mapBrowserEvent) {
    super(type)
    /**
     * 查询到的feature
     * @type {Array<import("../Feature.js").default>}
     * @api
     */
    this.identifyed = identifyed
    /**
     * Associated {@link module:ol/MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent
  }
}

export default IdentifyEvent
