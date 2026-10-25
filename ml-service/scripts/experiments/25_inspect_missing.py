import json
import pandas as pd

df = pd.read_parquet("data/fapar_zonal/fapar_kabupaten.parquet")

with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    info = {
        ft["properties"]["KDPKAB"]: (
            ft["properties"]["WADMKK"],
            ft["properties"]["WADMPR"],
        )
        for ft in json.load(f)["features"]
    }

df["nan"] = df["fapar_mean"].isna()
df = df.sort_values(["KDPKAB", "tanggal"])


def run_terpanjang(s):
    """Jumlah dekad berturut-turut terpanjang dengan nilai NaN."""
    best = cur = 0
    for v in s:
        cur = cur + 1 if v else 0
        best = max(best, cur)
    return best


per_kab = df.groupby("KDPKAB").agg(
    n_nan=("nan", "sum"),
    n_piksel=("n_piksel", "first"),
    metode=("metode_mask", "first"),
    max_n_valid=("n_valid", "max"),
)
per_kab["run_terpanjang"] = df.groupby("KDPKAB")["nan"].apply(run_terpanjang)
per_kab["nama"] = [info[k][0] for k in per_kab.index]
per_kab["provinsi"] = [info[k][1] for k in per_kab.index]

permanen = per_kab[per_kab["n_nan"] == 206]
print("=== Kabupaten NaN permanen:", len(permanen), "===")
print(permanen[["nama", "provinsi", "n_piksel", "metode", "max_n_valid"]].to_string())

sisa = per_kab[per_kab["n_nan"] < 206]
print("\n=== Kabupaten lainnya:", len(sisa), "===")
print("Jumlah dekad NaN per kabupaten:")
print(sisa["n_nan"].describe(percentiles=[0.5, 0.75, 0.9, 0.95]).round(1).to_string())
print("Run NaN terpanjang (dekad berturut-turut):")
print(
    sisa["run_terpanjang"]
    .describe(percentiles=[0.5, 0.75, 0.9, 0.95])
    .round(1)
    .to_string()
)
print("Kabupaten dengan run >= 10 dekad:", int((sisa["run_terpanjang"] >= 10).sum()))
print("Kabupaten dengan run >= 20 dekad:", int((sisa["run_terpanjang"] >= 20).sum()))
print("\n10 kabupaten dengan run terpanjang (di luar yang permanen):")
print(
    sisa.sort_values("run_terpanjang", ascending=False)
    .head(10)[["nama", "n_piksel", "n_nan", "run_terpanjang"]]
    .to_string()
)
