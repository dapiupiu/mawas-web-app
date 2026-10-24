import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv"

d = pd.read_csv(CSV, usecols=["date","adm_level","adm_id","PCODE",
                              "rfh","rfh_avg","rfq",
                              "r1h","r1h_avg","r1q",
                              "r3h","r3h_avg","r3q"])
d = d[d["adm_level"] == 2].copy()

# hindari rfh_avg = 0
m = d["rfh_avg"] > 0
pred = 100.0 * d.loc[m, "rfh"] / d.loc[m, "rfh_avg"]
diff = (pred - d.loc[m, "rfq"]).abs()

print("=== rfq vs 100*rfh/rfh_avg ===")
print("baris diuji:", int(m.sum()))
print("selisih abs: max=%.4f  median=%.4f  p99=%.4f" %
      (diff.max(), diff.median(), diff.quantile(0.99)))
print("baris dengan selisih > 0.5:", int((diff > 0.5).sum()))

for a, b, name in [("r1h","r1q","r1q"), ("r3h","r3q","r3q")]:
    m2 = d[f"{a}_avg"] > 0
    pred2 = 100.0 * d.loc[m2, a] / d.loc[m2, f"{a}_avg"]
    diff2 = (pred2 - d.loc[m2, b]).abs()
    print(f"\n=== {name} vs 100*{a}/{a}_avg ===")
    print("baris diuji:", int(m2.sum()))
    print("selisih abs: max=%.4f  median=%.4f  p99=%.4f" %
          (diff2.max(), diff2.median(), diff2.quantile(0.99)))
    print(f"baris dengan selisih > 0.5:", int((diff2 > 0.5).sum()))

# cek spesifik untuk ID9109 saja
s = d[d["PCODE"] == "ID9109"]
print("\nID9109: jumlah baris", len(s), "adm_id unik", s["adm_id"].nunique())