/**
  PropList:

{
  [PropertyName: string] -> {

    // We need to watch specific properties. e.g. for LatLngLiteral, we
    // watch only the lat and lng properties. Otherwise the digest cycle
    // will run to infinity if we use it with a filter

    watchCollection: String?, // When watching, use watchCollection and watch the specified collection
    watch: Function | String, // When watching, use the specified function
    watchGroup: String[], // watch the specified variables
  }
}

**/


export function propsToAngularProps (propList, eventList) {
  const withProps = Object.keys(propList).reduce(
    (props, prop) => {
      props[prop] = '<?'
      return props
    },
    {}
  )

  const withEvents = eventList.reduce(
    (props, event) => {
      props[`${event}Fn`] = `&?${event}`
      return props
    },
    withProps
  )

  return withEvents
}

export function optionsFromProps (propList, scope, exclude) {
  return Object.keys(propList).reduce(
    (opts, prop) => {
      if (scope[prop] === undefined) return opts
      else if (prop !== 'options'){
        opts[prop] = scope[prop]
        return opts
      } else {
        return {
          ...scope[prop],
          ...opts,
        }
      }
    },
    {}
  )
}

/**
  * For wrapping around the Google Maps API.
  */
const gmapDefaultSetter = prop => function defaultSetter (obj, newValue) {
  const firstLetterCapitalized = prop.replace(/^./, x => x.toUpperCase())

  if (! (typeof obj[`set${firstLetterCapitalized}`] === 'function')) {
    console.warn(obj, 'does not support method ', `set${firstLetterCapitalized}`)
    throw new Error(`Object does not support method set${firstLetterCapitalized}`)
  }

  obj[`set${firstLetterCapitalized}`](newValue)
}

const errorSetter = () => { throw new Error('Native maps not implemented') }

export function setUpWatchers (propList, scope, mapObject, implementation='js',
                               ignoreFirst=false, defaultSetter=gmapDefaultSetter) {
  for (let prop of Object.keys(propList)) {
    const setter = (implementation === 'js')
      ? propList[prop].jsSet || defaultSetter(prop)
      : propList[prop].nativeSetter || errorSetter

    if (propList[prop].watchCollection) {
      scope.$watchCollection(propList[prop].watchCollection, (newValue, oldValue) => {
        setter(mapObject, newValue)
      })
    } else if (propList[prop].watchGroup) {
      scope.$watchGroup(propList[prop].watchGroup, (newValue, oldValue) => {
        if (ignoreFirst && newValue.every((v, i) => v === oldValue[i])) return

        setter(mapObject, newValue)
      })
    } else { /* regular watch */
      scope.$watch(propList[prop].watch || prop, (newValue, oldValue) => {
        // Ignore first time
        if (ignoreFirst && newValue === oldValue) return

        setter(mapObject, newValue)
      })
    }
  }
}

export function setUpEvents (eventList, scope, mapObject) {
  for (let event of eventList) {
    const eventHandler = `${event}Fn`

    /* Note: I don't expect event handlers to change much, so no watch */
    if (scope[eventHandler]) {
      google.maps.event.addListener(
        mapObject,
        event,
        ($event) => scope[eventHandler]({$event})
      )
    }
  }
}
