export const INDONESIA_BOUNDS = {
  minLon: 95.0,
  maxLon: 141.2,
  minLat: -11.1,
  maxLat: 6.1,
  width: 1000,
  height: 380,
  padding: 18
}

export function projectMercator(
  [lon, lat]: [number, number],
  bounds = INDONESIA_BOUNDS
): [number, number] {
  const { minLon, maxLon, minLat, maxLat, width, height, padding } = bounds
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  const x = padding + ((lon - minLon) / (maxLon - minLon)) * innerW

  const rad = (lat * Math.PI) / 180
  const mercY = Math.log(Math.tan(Math.PI / 4 + rad / 2))

  const minRad = (minLat * Math.PI) / 180
  const maxRad = (maxLat * Math.PI) / 180
  const minMerc = Math.log(Math.tan(Math.PI / 4 + minRad / 2))
  const maxMerc = Math.log(Math.tan(Math.PI / 4 + maxRad / 2))

  const y = padding + ((maxMerc - mercY) / (maxMerc - minMerc)) * innerH
  return [x, y]
}

export function geometryToSvgPath(
  geometry: { type: string; coordinates: any },
  project: (pt: [number, number]) => [number, number] = projectMercator
): string {
  const rings: [number, number][][] = []
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      if (Array.isArray(ring)) rings.push(ring)
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (Array.isArray(poly)) {
        for (const ring of poly) {
          if (Array.isArray(ring)) rings.push(ring)
        }
      }
    }
  }

  return rings
    .map((ring) => {
      if (!ring || ring.length === 0) return ""
      return (
        ring
          .map(([lon, lat], i) => {
            const [x, y] = project([lon, lat])
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
          })
          .join("") + "Z"
      )
    })
    .filter(Boolean)
    .join(" ")
}
