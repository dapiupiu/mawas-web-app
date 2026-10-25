import pandas as pd

r = pd.read_parquet("data/rainfall/rainfall_kabupaten.parquet")
print("Bentuk:", r.shape)
print("Kolom:", list(r.columns))
print("\ndtypes:")
print(r.dtypes)

print("\nRentang tanggal:", r["date"].min(), "->", r["date"].max())
print("Jumlah tanggal unik:", r["date"].nunique())
print("Jumlah KDPKAB unik:", r["KDPKAB"].nunique())

# fokus kolom yang relevan untuk faktor_penyebab
for k in ["rfq", "r1q", "r3q", "rfh", "version", "anomaly_status"]:
    if k not in r.columns:
        continue
    s = r[k]
    print(f"\n{k}: dtype={s.dtype}, null={int(s.isna().sum())}")
    if pd.api.types.is_numeric_dtype(s):
        print("  describe:", s.describe().round(2).to_dict())
    else:
        print("  value_counts:", s.value_counts(dropna=False).to_dict())

# cek 11 Sep 2026: apakah baris ada untuk tanggal ini?
tgl = pd.Timestamp("2026-09-11")
x = r[r["date"] == tgl]
print("\n11 Sep 2026: baris =", len(x), "| KDPKAB unik =", x["KDPKAB"].nunique())
if len(x):
    print("  rfq describe:", x["rfq"].describe().round(2).to_dict())
    print("  rfq < 80  :", int((x["rfq"] < 80).sum()))
    print("  rfq 80-120:", int(((x["rfq"] >= 80) & (x["rfq"] <= 120)).sum()))
    print("  rfq > 120 :", int((x["rfq"] > 120).sum()))
    print("  rfq null  :", int(x["rfq"].isna().sum()))