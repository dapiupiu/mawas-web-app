
export type RiskLevel = "Rendah" | "Sedang" | "Tinggi"

export type SampleRisk = {
  status: RiskLevel
  color: string
  fapar: string
  rain: string
  vegetationIndex: string
  condition: string
}

export type ProvinceProperties = {
  id: string
  kode: number
  name: string
  bbox: [number, number, number, number]
  center: [number, number]
  sampleRisk: SampleRisk
}

export type ProvinceFeature = {
  type: "Feature"
  properties: ProvinceProperties
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
}

export type IndonesiaGeoJson = {
  type: "FeatureCollection"
  metadata?: {
    title: string
    source: string
    description: string
  }
  features: ProvinceFeature[]
}

export type KabupatenProperties = {
  id: string
  prov_id: string
  prov_name: string
  kab_name: string
  bbox: [number, number, number, number]
  center: [number, number]
  sampleRisk: SampleRisk
}

export type KabupatenFeature = {
  type: "Feature"
  properties: KabupatenProperties
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
}

export type KabupatenGeoJson = {
  type: "FeatureCollection"
  features: KabupatenFeature[]
}
