import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Camera,
  ExternalLink,
  ImageIcon,
  Loader2,
  Rows3,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { GridBackground, MovingBorder, SpotlightHero } from '@/components/aceternity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { postAnalyze, type AnalyzeResponse } from '@/lib/api'

const schema = z.object({
  reference_label: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const REFERENCE_PRESETS: { label: string; reference_label: string }[] = [
  { label: 'SOP figure', reference_label: 'SOP-HVAC-114 Fig A-12 nameplate layout (rev 4)' },
  { label: 'Wiring diagram', reference_label: 'Single-line LVM-2024-009 Panel L14 feeder (as-built 2023-08)' },
  { label: 'Nameplate spec', reference_label: 'OEM nameplate model XR-200 nominal FLA 42 A' },
  { label: 'Commissioning photo', reference_label: 'Cx photo set CT-07 strainer basket orientation' },
  { label: 'Arc flash label', reference_label: 'NFPA 70E arc-flash label Cat 2 @ 18 in working distance' },
  { label: 'Label not listed', reference_label: 'Field photo — corroded lug kit; compare to golden template' },
]

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference_label: '' },
  })

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!file) throw new Error('Choose an image or PDF page export.')
      return postAnalyze(file, values.reference_label ?? '')
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Analysis complete', { description: data.request_id })
    },
    onError: (e: Error) => toast.error('Analyze failed', { description: e.message }),
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values)
  }

  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <header
        className="border-b border-[var(--color-cream-edge)] bg-[#fffdf8]/85 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-rose-deep)] text-white shadow-sm aperture-pulse">
              <Camera className="size-5" aria-hidden />
            </div>
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose-deep)]">
                SelfAware® · Studio V
              </p>
              <h1 className="studio-display text-xl font-semibold text-[var(--color-warm-ink)]">
                VisioScan
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              <BookOpen className="size-4" />
              OpenAPI
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </Button>
        </div>
      </header>

      <main id="main" role="main" className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <SpotlightHero className="p-6 md:p-9">
          <div className="space-y-3">
            <Badge variant="warning">Field ↔ golden reference</Badge>
            <h2 className="studio-display text-3xl font-semibold tracking-tight text-[var(--color-warm-ink)] md:text-4xl">
              Compare-and-critique studio
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-warm-ink-soft)]">
              Multipart upload to <code className="mono rounded bg-stone-100 px-1">POST /v1/analyze</code>.
              When <code className="mono rounded bg-stone-100 px-1">OLLAMA_BASE_URL</code> is set, images
              route to a local vision model for as-built vs design diffing.
            </p>
          </div>
        </SpotlightHero>

        <MovingBorder>
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-5 text-amber-700" />
                Upload
              </CardTitle>
              <CardDescription>PNG/JPEG recommended for live vision path.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="file">Field capture</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_label">Reference label (optional)</Label>
                  <p className="text-xs text-zinc-500">
                    What to compare against (feeds the vision prompt). Try a preset:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REFERENCE_PRESETS.map((ex) => (
                      <Button
                        key={ex.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto max-w-full whitespace-normal py-1.5 text-left text-xs font-normal"
                        onClick={() => form.setValue('reference_label', ex.reference_label)}
                      >
                        {ex.label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    id="reference_label"
                    placeholder="e.g. SOP Fig A-12 / wiring diagram rev 4"
                    {...form.register('reference_label')}
                  />
                </div>
                <Button type="submit" disabled={mutation.isPending || !file}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Rows3 className="size-4" />
                      Run analysis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </MovingBorder>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reference (stub panel)</CardTitle>
              <CardDescription>
                Placeholder for golden image / PDF slice from your library.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center text-sm text-zinc-500">
                Connect library service or paste reference uri in phase 2.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field upload preview</CardTitle>
              <CardDescription>Local preview only — not stored in-browser after refresh.</CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="max-h-80 w-full rounded-xl border border-zinc-200 object-contain"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
                  No file selected
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {result ? (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
                <CardDescription className="font-mono text-xs">{result.request_id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-700">{result.summary}</p>
                {result.vision_notes ? (
                  <div className="rounded-lg bg-amber-50/80 p-3 text-sm text-amber-950">
                    <Badge variant="warning" className="mb-2">
                      vision model
                    </Badge>
                    <p className="whitespace-pre-wrap">{result.vision_notes}</p>
                  </div>
                ) : null}
                <p className="text-xs text-zinc-500">{result.disclaimer}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discrepancies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.discrepancies.map((d) => (
                  <div
                    key={d.code}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="default" className="font-mono">
                        {d.code}
                      </Badge>
                      <Badge variant="outline">{d.severity}</Badge>
                      <span className="text-xs font-medium text-zinc-500">{d.field}</span>
                    </div>
                    <p className="text-sm text-zinc-700">{d.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>
        ) : null}
      </main>
    </div>
  )
}
