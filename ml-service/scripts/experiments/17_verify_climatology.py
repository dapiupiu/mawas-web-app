import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv" 

d = pd.read_csv(CSV, usecols=["date","adm_level","adm_id","PCODE",
                              "rfh","rfh_avg","rfq"])
d = d[d["adm_level"] == 2].copy()
d["date"] = pd.to_datetime(d["date"])

# posisi dekad-of-year: bulan (1-12) + bagian (1,2,3)
d["day"] = d["date"].dt.day
d["dekad_of_month"] = np.where(d["day"] <= 10, 1,
                       np.where(d["day"] <= 20, 2, 3))
d["month"] = d["date"].dt.month
d["dekad_of_year"] = (d["month"] - 1) * 3 + d["dekad_of_month"]   # 1..36

# Untuk tiap (adm_id, dekad_of_year): apakah rfh_avg konstan lintas tahun?
g = d.groupby(["adm_id","dekad_of_year"])["rfh_avg"].nunique()
print("jumlah pasangan (adm_id, dekad_of_year):", len(g))
print("dengan >1 nilai rfh_avg berbeda:", int((g > 1).sum()))
print("distribusi nilai unik per pasangan:")
print(g.value_counts().to_string())

# contoh konkret: satu adm_id, satu dekad_of_year
aid = d["adm_id"].iloc[0]
for dov in [1, 10, 18, 30]:
    s = d[(d["adm_id"] == aid) & (d["dekad_of_year"] == dov)].sort_values("date")
    if len(s) > 0:
        uniq = s["rfh_avg"].nunique()
        print(f"\nadm_id={aid} dekad_of_year={dov}: "
              f"{len(s)} baris, rfh_avg unik={uniq}, "
              f"min={s['rfh_avg'].min():.3f}, max={s['rfh_avg'].max():.3f}")

# Uji rumus rfq = 100*rfh/rfh_avg pada subset 2021-2026 saja
# (baseline mungkin dihitung dari 1981-2010 atau 1991-2020, dan konsisten setelah itu)
sub = d[(d["date"] >= "2021-01-01") & (d["date"] <= "2026-09-30")].copy()
m = sub["rfh_avg"] > 0
pred = 100.0 * sub.loc[m, "rfh"] / sub.loc[m, "rfh_avg"]
diff = (pred - sub.loc[m, "rfq"]).abs()
print("\n=== uji rumus pada 2021-2026 saja ===")
print("baris:", int(m.sum()))
print("median selisih: %.4f  p99: %.4f  max: %.4f" %
      (diff.median(), diff.quantile(0.99), diff.max()))
print("baris selisih > 0.5:", int((diff > 0.5).sum()))

# Uji per dekad_of_year: apakah sebagian besar cocok?
by = sub.loc[m].groupby("dekad_of_year").apply(
    lambda x: (100.0*x["rfh"]/x["rfh_avg"] - x["rfq"]).abs().median(),
    include_groups=False)
print("\nmedian selisih per dekad_of_year (36 angka):")
print(by.round(3).to_string())