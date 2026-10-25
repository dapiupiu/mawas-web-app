"""
Mapping PCODE (CHIRPS/WFP) ke KDPKAB (GeoJSON), dengan agregasi
untuk PCODE ganda (ID9109: adm_id 1006805 + 1006807).

Output:
  data/mapping/pcode_to_kdpkab.csv      (hanya yang match, termasuk ID9109 gabungan)
  data/mapping/wilayah_tidak_cocok.csv  (semua yang tidak match, dua arah)
  data/rainfall/rainfall_kabupaten.parquet  (hanya untuk KDPKAB yang match)
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv"
GEOJSON = ROOT / "data" / "geojson" / "kabupaten_clean.geojson"
OUT_DIR = ROOT / "data" / "mapping"
OUT_DIR.mkdir(parents=True, exist_ok=True)
RAIN_DIR = ROOT / "data" / "rainfall"
RAIN_DIR.mkdir(parents=True, exist_ok=True)

# ---- 1. baca GeoJSON bersih ----
with GEOJSON.open(encoding="utf-8") as f:
    gj = json.load(f)
geo = pd.DataFrame(
    [
        {
            "KDPKAB": f["properties"]["KDPKAB"],
            "WADMKK": f["properties"]["WADMKK"],
            "WADMPR": f["properties"]["WADMPR"],
            "has_geometry": f["properties"]["has_geometry"],
        }
        for f in gj["features"]
    ]
)
print(f"GeoJSON: {len(geo)} kabupaten/kota, {geo['has_geometry'].sum()} ber-geometri")

# ---- 2. baca curah hujan ----
COLS = [
    "date",
    "adm_level",
    "adm_id",
    "PCODE",
    "n_pixels",
    "rfh",
    "rfh_avg",
    "rfq",
    "r1h",
    "r1h_avg",
    "r1q",
    "r3h",
    "r3h_avg",
    "r3q",
    "version",
]
d = pd.read_csv(CSV, usecols=COLS)
d = d[d["adm_level"] == 2].copy()
d["date"] = pd.to_datetime(d["date"])
d = d[(d["date"] >= "2021-01-01") & (d["date"] <= "2026-09-30")].copy()
print(
    f"Curah hujan 2021-2026 (adm_level=2): {len(d)} baris, "
    f"{d['PCODE'].nunique()} PCODE unik, {d['date'].nunique()} dekad"
)

# ---- 3. bangun mapping PCODE -> KDPKAB ----
geo["expected_PCODE"] = "ID" + geo["KDPKAB"].str.replace(".", "", regex=False)
pcode_uniq = d[["PCODE", "adm_id"]].drop_duplicates()
pcode_to_adm = pcode_uniq.groupby("PCODE")["adm_id"].apply(lambda s: sorted(s.tolist()))

mapping = geo[["KDPKAB", "WADMKK", "WADMPR", "has_geometry", "expected_PCODE"]].copy()
mapping["PCODE"] = mapping["expected_PCODE"]
mapping["in_rainfall"] = mapping["PCODE"].isin(pcode_to_adm.index)


def adm_str(pcode):
    if pcode in pcode_to_adm:
        return "+".join(str(x) for x in pcode_to_adm[pcode])
    return None


mapping["adm_id_asli"] = mapping["PCODE"].map(adm_str)
mapping["n_adm_id"] = (
    mapping["adm_id_asli"]
    .fillna("")
    .apply(lambda s: 0 if s == "" else s.count("+") + 1)
)
mapping["merged"] = mapping["n_adm_id"] > 1
mapping["merged_reason"] = np.where(mapping["merged"], "duplicate_pcode", "")
mapping["anomaly_status"] = np.where(mapping["merged"], "estimated", "native")

# ---- 4. daftar tidak cocok (dua arah) ----
only_geo = mapping[~mapping["in_rainfall"]].copy()
only_geo["sumber"] = "hanya_di_geojson"

rain_codes = set(pcode_to_adm.index)
geo_codes = set(mapping["PCODE"])
only_rain_pcodes = rain_codes - geo_codes
only_rain = pd.DataFrame({"PCODE": sorted(only_rain_pcodes)})
only_rain["KDPKAB"] = only_rain["PCODE"].str.replace(
    r"^ID(\d{2})(\d{2})$", r"\1.\2", regex=True
)
only_rain["WADMKK"] = None
only_rain["WADMPR"] = None
only_rain["adm_id_asli"] = only_rain["PCODE"].map(adm_str)
only_rain["sumber"] = "hanya_di_curah_hujan"

tidak_cocok = pd.concat(
    [
        only_geo[["KDPKAB", "WADMKK", "WADMPR", "PCODE", "adm_id_asli", "sumber"]],
        only_rain[["KDPKAB", "WADMKK", "WADMPR", "PCODE", "adm_id_asli", "sumber"]],
    ],
    ignore_index=True,
)
tidak_cocok.to_csv(OUT_DIR / "wilayah_tidak_cocok.csv", index=False)

print(
    f"\nMapping: {mapping['in_rainfall'].sum()} kabupaten punya data curah hujan "
    f"({mapping['merged'].sum()} gabungan)"
)
print(
    f"Wilayah tidak cocok: {len(tidak_cocok)} "
    f"({(tidak_cocok['sumber'] == 'hanya_di_geojson').sum()} hanya di GeoJSON, "
    f"{(tidak_cocok['sumber'] == 'hanya_di_curah_hujan').sum()} hanya di CHIRPS)"
)

# ---- 5. mapping output: HANYA yang match (473 + 1 merged = 474) ----
mapping_out = mapping.loc[
    mapping["in_rainfall"],
    [
        "PCODE",
        "KDPKAB",
        "WADMKK",
        "WADMPR",
        "has_geometry",
        "adm_id_asli",
        "n_adm_id",
        "merged",
        "merged_reason",
        "anomaly_status",
    ],
].copy()
mapping_out.to_csv(OUT_DIR / "pcode_to_kdpkab.csv", index=False)
print(f"\nTersimpan: {OUT_DIR / 'pcode_to_kdpkab.csv'} ({len(mapping_out)} baris)")
print(f"Tersimpan: {OUT_DIR / 'wilayah_tidak_cocok.csv'} ({len(tidak_cocok)} baris)")


# ---- 6. agregasi (hanya PCODE yang match) ----
def weighted_mean(vals, weights):
    v = pd.to_numeric(pd.Series(vals), errors="coerce").to_numpy()
    w = pd.to_numeric(pd.Series(weights), errors="coerce").to_numpy()
    m = ~pd.isna(v) & ~pd.isna(w) & (w > 0)
    if m.sum() == 0:
        return np.nan
    return float((v[m] * w[m]).sum() / w[m].sum())


matching_pcodes = set(mapping_out["PCODE"])
d_match = d[d["PCODE"].isin(matching_pcodes)].copy()
print(
    f"\nData curah hujan untuk {d_match['PCODE'].nunique()} PCODE match: "
    f"{len(d_match)} baris"
)

kolom_rata = ["rfh", "r1h", "r3h", "rfh_avg", "r1h_avg", "r3h_avg"]
agregat_rows = []
for pcode, grp in d_match.groupby("PCODE"):
    adm_ids = sorted(grp["adm_id"].unique())
    if len(adm_ids) == 1:
        g = grp.copy()
        g["anomaly_status"] = "native"
        agregat_rows.append(g)
    else:
        pieces = []
        for dt, sub in grp.groupby("date"):
            row = {
                "date": dt,
                "adm_level": 2,
                "adm_id": "+".join(str(x) for x in sorted(sub["adm_id"].unique())),
                "PCODE": pcode,
                "n_pixels": int(sub["n_pixels"].sum()),
                "version": sub["version"].mode().iloc[0]
                if not sub["version"].mode().empty
                else None,
                "anomaly_status": "estimated",
            }
            for col in kolom_rata:
                row[col] = weighted_mean(sub[col].values, sub["n_pixels"].values)
            row["rfq"] = (
                100.0 * row["rfh"] / row["rfh_avg"]
                if row["rfh_avg"] and row["rfh_avg"] > 0 and pd.notna(row["rfh"])
                else np.nan
            )
            row["r1q"] = (
                100.0 * row["r1h"] / row["r1h_avg"]
                if row["r1h_avg"] and row["r1h_avg"] > 0 and pd.notna(row["r1h"])
                else np.nan
            )
            row["r3q"] = (
                100.0 * row["r3h"] / row["r3h_avg"]
                if row["r3h_avg"] and row["r3h_avg"] > 0 and pd.notna(row["r3h"])
                else np.nan
            )
            pieces.append(row)
        agg = pd.DataFrame(pieces)
        agregat_rows.append(agg)
        print(f"  agregasi {pcode}: {len(adm_ids)} adm_id -> {len(agg)} baris")

rainfall = pd.concat(agregat_rows, ignore_index=True)
rainfall = rainfall.merge(mapping_out[["PCODE", "KDPKAB"]], on="PCODE", how="left")
rainfall = rainfall.sort_values(["KDPKAB", "date"]).reset_index(drop=True)

print(
    f"\nRainfall akhir: {len(rainfall)} baris, "
    f"{rainfall['KDPKAB'].nunique()} KDPKAB, "
    f"{rainfall['date'].nunique()} dekad"
)
print("anomaly_status:", rainfall["anomaly_status"].value_counts().to_dict())
print("KDPKAB kosong:", int(rainfall["KDPKAB"].isna().sum()))

out_path = RAIN_DIR / "rainfall_kabupaten.parquet"
# paksa tipe kolom string agar pyarrow bisa infer (adm_id campuran int & str)
for col in ["adm_id", "PCODE", "KDPKAB", "version"]:
    rainfall[col] = rainfall[col].astype(str)
rainfall.to_parquet(out_path, index=False)
print(f"Tersimpan: {out_path}")

expected = mapping_out["PCODE"].nunique() * rainfall["date"].nunique()
print(
    f"harapan {expected} baris = {mapping_out['PCODE'].nunique()} PCODE x "
    f"{rainfall['date'].nunique()} dekad: "
    f"{'OK' if len(rainfall) == expected else 'MELESET'}"
)
