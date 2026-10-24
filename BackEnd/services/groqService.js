const crypto = require('crypto');
const fs = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const FALLBACK_TEXT = 'Analisis tidak dapat ditampilkan saat ini. Silakan coba lagi nanti.';
const PROMPT_PATH = path.resolve(__dirname, '../prompts/system_prompt.txt');
const inFlight = new Map();
let supabase;

const normalizePrompt = (prompt) => prompt.replace(/\r\n?/g, '\n');

const loadSystemPrompt = async () => fs.readFile(PROMPT_PATH, 'utf8');

const getSupabase = () => {
  if (supabase) return supabase;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi untuk cache GenAI.');
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return supabase;
};

const hashPrompt = (prompt) =>
  crypto.createHash('sha256').update(normalizePrompt(prompt)).digest('hex').slice(0, 8);

const createUserPrompt = (risk) => {
  const score = risk.skor_risiko === null || risk.skor_risiko === undefined
    ? 'tidak tersedia'
    : (Number(risk.skor_risiko) * 100).toFixed(2).replace(/\.?0+$/, '');
  const weatherRatio = risk.rfq === null || risk.rfq === undefined
    ? 'tidak tersedia'
    : risk.rfq;
  const lines = [
    'DATA:',
    `- Kabupaten: ${risk.nama_kabupaten || 'tidak tersedia'}`,
    `- Provinsi: ${risk.provinsi || 'tidak tersedia'}`,
    `- Tanggal: ${risk.tanggal} (horizon ${risk.horizon_hari} hari)`,
    `- Kategori risiko: ${risk.kategori || 'data tidak tersedia'}`,
    `- Skor risiko: ${score}`,
    `- Faktor penyebab: ${risk.faktor_penyebab || 'tidak tersedia'}`,
    `- Curah hujan (rfq): ${weatherRatio}`,
  ];
  if (risk.alasan_vegetasi_kosong) {
    lines.push(`- Alasan data vegetasi kosong: ${risk.alasan_vegetasi_kosong}`);
  }
  if (risk.alasan_cuaca_kosong) {
    lines.push(`- Alasan data cuaca kosong: ${risk.alasan_cuaca_kosong}`);
  }
  lines.push('', 'Buat analisis sesuai aturan untuk kabupaten ini.');
  return lines.join('\n');
};

const parseNumbers = (value) =>
  Array.from(value.matchAll(/\d+(?:[.,]\d+)?/g), ([match]) => Number(match.replace(',', '.')));

const validateOutput = (text, risk, userPrompt) => {
  const normalized = String(text || '').trim();
  if (!normalized) return 'Respons model kosong.';

  const forbidden = [
    'gagal panen',
    'krisis pangan',
    'paceklik',
    'pasti',
    'dijamin',
    'akurat',
    'real-time',
  ];
  const lower = normalized.toLowerCase();
  if (forbidden.some((phrase) => lower.includes(phrase))) {
    return 'Respons memuat frasa yang dilarang.';
  }
  if (/\b(?:kondisi|penyebab|penjelasan|saran)\s*:/i.test(normalized)) {
    return 'Respons memuat label komponen yang dilarang.';
  }

  const sentenceCount = normalized.split(/(?<=[.!?])\s+/u).length;
  if (sentenceCount > 5) return 'Respons melebihi batas lima kalimat.';

  const allowedNumbers = [
    ...parseNumbers(userPrompt),
    ...parseNumbers(risk.faktor_penyebab || ''),
    ...parseNumbers(risk.alasan_vegetasi_kosong || ''),
    ...parseNumbers(risk.alasan_cuaca_kosong || ''),
    100,
  ];
  if (/\b(?:10\s+hari|dekadal)\b/i.test(userPrompt)) allowedNumbers.push(10);
  if (risk.skor_risiko !== null && risk.skor_risiko !== undefined) {
    const score = Number(risk.skor_risiko) * 100;
    allowedNumbers.push(score, 100 - score);
  }
  for (const value of parseNumbers(normalized)) {
    if (!allowedNumbers.some((allowed) => Math.abs(allowed - value) <= 0.6)) {
      return `Respons memuat angka yang tidak didukung data (${value}).`;
    }
  }
  return null;
};

const callGroq = async (systemPrompt, userPrompt) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY belum dikonfigurasi di environment Backend.');
  }
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 1500,
      reasoning_effort: 'low',
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw new Error(`Groq mengembalikan status HTTP ${response.status}.`);
  }
  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Respons Groq tidak berisi teks analisis.');
  }
  return {
    text: text.trim(),
    usage: result.usage || null,
  };
};

const createCacheKey = (code, date, promptHash) =>
  `${code}|${date}|${MODEL}|${promptHash}`;

const getCacheEntry = async (code, date, promptHash) => {
  const { data, error } = await getSupabase()
    .from('genai_cache')
    .select('teks,dihasilkan_pada,model,usage')
    .eq('kode_kabupaten', code)
    .eq('tanggal', date)
    .eq('model', MODEL)
    .eq('prompt_hash', promptHash)
    .maybeSingle();

  if (error) throw new Error(`Gagal membaca cache GenAI Supabase: ${error.message}`);
  return data;
};

const saveCacheEntry = async (code, date, promptHash, entry) => {
  const { error } = await getSupabase()
    .from('genai_cache')
    .upsert({
      kode_kabupaten: code,
      tanggal: date,
      model: MODEL,
      prompt_hash: promptHash,
      teks: entry.teks,
      dihasilkan_pada: entry.dihasilkan_pada,
      usage: entry.usage,
    }, { onConflict: 'kode_kabupaten,tanggal,model,prompt_hash' });

  if (error) throw new Error(`Gagal menyimpan cache GenAI ke Supabase: ${error.message}`);
};

const generateAnalysis = async (risk) => {
  const systemPrompt = await loadSystemPrompt();
  const promptHash = hashPrompt(systemPrompt);
  const userPrompt = createUserPrompt(risk);
  const key = createCacheKey(risk.kode_kabupaten, risk.tanggal, promptHash);
  const cached = await getCacheEntry(risk.kode_kabupaten, risk.tanggal, promptHash);

  if (cached?.teks) {
    const invalidReason = validateOutput(cached.teks, risk, userPrompt);
    if (!invalidReason) {
      return {
        teks: cached.teks,
        dari_cache: true,
        dihasilkan_pada: cached.dihasilkan_pada,
        model: MODEL,
      };
    }
    console.warn(`Cache GenAI ${key} dilewati: ${invalidReason}`);
    return {
      teks: FALLBACK_TEXT,
      dari_cache: false,
      dihasilkan_pada: new Date().toISOString(),
      model: MODEL,
    };
  }

  if (inFlight.has(key)) return inFlight.get(key);

  const request = (async () => {
    const { text, usage } = await callGroq(systemPrompt, userPrompt);
    const invalidReason = validateOutput(text, risk, userPrompt);
    if (invalidReason) {
      console.warn(`Respons Groq untuk ${key} tidak lolos validasi: ${invalidReason}`);
      return {
        teks: FALLBACK_TEXT,
        dari_cache: false,
        dihasilkan_pada: new Date().toISOString(),
        model: MODEL,
      };
    }

    const generatedAt = new Date().toISOString();
    await saveCacheEntry(risk.kode_kabupaten, risk.tanggal, promptHash, {
      teks: text,
      dihasilkan_pada: generatedAt,
      usage,
    });
    return {
      teks: text,
      dari_cache: false,
      dihasilkan_pada: generatedAt,
      model: MODEL,
    };
  })();
  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
};

module.exports = {
  FALLBACK_TEXT,
  MODEL,
  createUserPrompt,
  generateAnalysis,
  hashPrompt,
  validateOutput,
};
