import type { Metadata } from "next"

import { Editor } from "@/components/editor/editor"

export const metadata: Metadata = { title: "Éditeur · Cover Studio" }

export default function EditorPage() {
  return <Editor />
}
