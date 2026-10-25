import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv"  

d = pd.read_csv(CSV, usecols=["date","adm_level","adm_id","PCODE",
                              "rfh","rfh_avg","rfq",
                              "r1h","r1h_avg","r1q",
                              "r3h","r3h_avg","r3q"])
d = d[d["adm_level"] == 2].copy()

# apakah rfh_avg konstan per adm_id?
n_uniq = d.groupby("adm_id")["rfh_avg"].nunique()
print("=== rfh_avg per adm_id ===")
print("jumlah adm_id:", len(n_uniq))
print("adm_id dengan >1 nilai rfh_avg:", int((n_uniq > 1).sum()))
print("distribusi jumlah nilai unik rfh_avg per adm_id:")
print(n_uniq.value_counts().to_string())

# sama untuk r1h_avg dan r3h_avg
for col in ["r1h_avg","r3h_avg"]:
    n = d.groupby("adm_id")[col].nunique()
    print(f"\n{col}: adm_id dengan >1 nilai = {int((n > 1).sum())} dari {len(n)}")
    print(n.value_counts().to_string())

# contoh: satu adm_id yang banyak nilai (kalau ada)
many = n_uniq[n_uniq > 1]
if len(many) > 0:
    aid = many.index[0]
    s = d[d["adm_id"] == aid].sort_values("date")[["date","rfh","rfh_avg","rfq"]].head(15)
    print(f"\ncontoh adm_id={aid}, 15 dekad pertama:")
    print(s.to_string())
else:
    print("\nrfh_avg KONSTAN per adm_id (tidak bergulir).")

# coba rumus alternatif: apakah rfq = 100 * (rfh - rfh_avg)/rfh_avg ?
# (anomali persen terhadap baseline, bukan rasio)
m = (d["rfh_avg"] > 0)
pred_a = 100.0 * (d.loc[m,"rfh"] - d.loc[m,"rfh_avg"]) / d.loc[m,"rfh_avg"]
diff_a = (pred_a - d.loc[m,"rfq"]).abs()
print("\n=== rfq vs 100*(rfh-rfh_avg)/rfh_avg (anomali persen) ===")
print("median selisih: %.4f  p99: %.4f  max: %.4f" %
      (diff_a.median(), diff_a.quantile(0.99), diff_a.max()))
print("baris selisih > 0.5:", int((diff_a > 0.5).sum()))

# cek korelasi arah: kalau rfh > rfh_avg, apakah rfq selalu > 100?
bigger = d.loc[m & (d["rfh"] > d["rfh_avg"])]
smaller = d.loc[m & (d["rfh"] < d["rfh_avg"])]
print("\nrfq median saat rfh > rfh_avg:", float(bigger["rfq"].median()))
print("rfq median saat rfh < rfh_avg:", float(smaller["rfq"].median()))
print("jumlah baris rfh > avg:", len(bigger), " rfh < avg:", len(smaller))