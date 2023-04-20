function getEchartsOption(seriesData) {
  const geoCoordMap = {
    赤城街道: {
      coordinate: [121.0457, 29.1674],
      radius: 45 * 0.7
    },
    始丰街道: {
      coordinate: [120.962, 29.1391],
      radius: 45 * 0.7
    },
    福溪街道: {
      coordinate: [121.0413, 29.0908],
      radius: 45 * 0.7
    },
    白鹤镇: {
      coordinate: [120.9578, 29.2516],
      radius: 45 * 0.7
    },
    石梁镇: {
      coordinate: [121.1015, 29.2674],
      radius: 45 * 0.7
    },
    洪畴镇: {
      coordinate: [121.2059, 29.0695],
      radius: 45 * 0.7
    },
    街头镇: {
      coordinate: [120.7702, 29.0924],
      radius: 45 * 0.7
    },
    平桥镇: {
      coordinate: [120.8768, 29.1655],
      radius: 45 * 0.7
    },
    坦头镇: {
      coordinate: [121.1322, 29.1464],
      radius: 45 * 0.7
    },
    三合镇: {
      coordinate: [121.1609, 29.0829],
      radius: 45 * 0.7
    },
    三洲乡: {
      coordinate: [120.8111, 29.2151],
      radius: 45 * 0.7
    },
    龙溪乡: {
      coordinate: [120.7996, 29.0231],
      radius: 45 * 0.7
    },
    雷峰乡: {
      coordinate: [120.8988, 29.0581],
      radius: 45 * 0.7
    },
    南屏乡: {
      coordinate: [120.9738, 29.0668],
      radius: 45 * 0.7
    },
    泳溪乡: {
      coordinate: [121.2083, 29.1695],
      radius: 45 * 0.7
    }
  }

  const seriesOption = []

  seriesData.forEach(element => {
    if (element.A != 0 || element.B != 0 || element.C != 0 || element.D != 0) {
      const name = element.name
      seriesOption.push({
        name: name,
        type: 'pie',
        radius: geoCoordMap[name].radius,
        coordinates: geoCoordMap[name].coordinate,
        color: ['#44F842', '#328BFC', '#FABF23', '#F60000'],
        data: [
          { name: 'A类企业', value: element.A },
          { name: 'B类企业', value: element.B },
          { name: 'C类企业', value: element.C },
          { name: 'D类企业', value: element.D }
        ],
        label: {
          normal: {
            show: false
          }
        },
        itemStyle: {
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      })
    }
  })

  var echartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    series: seriesOption
  }

  return echartsOption
}

export default getEchartsOption
