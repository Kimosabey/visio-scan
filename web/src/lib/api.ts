const base =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export type Discrepancy = {
  code: string
  severity: string
  field: string
  detail: string
}

export type AnalyzeResponse = {
  request_id: string
  filename: string
  content_type: string | null
  summary: string
  discrepancies: Discrepancy[]
  vision_notes: string | null
  disclaimer: string
}

export async function postAnalyze(file: File, referenceLabel: string): Promise<AnalyzeResponse> {
  const fd = new FormData()
  fd.append('file', file)
  if (referenceLabel.trim()) fd.append('reference_label', referenceLabel.trim())

  const res = await fetch(`${base}/v1/analyze`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = (await res.json()) as { detail?: unknown }
      if (typeof err.detail === 'string') detail = err.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<AnalyzeResponse>
}
