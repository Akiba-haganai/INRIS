import { listDocuments, listGuidance } from '@/lib/documents'
import { DocumentUpload } from '@/components/staff/DocumentUpload'
import { DocumentList } from '@/components/staff/DocumentList'
import { GuidanceList } from '@/components/staff/GuidanceList'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const documents = await listDocuments()
  const guidance = await listGuidance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display font-semibold tracking-tight">
          Knowledge base
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload authoritative guidance documents. The system extracts, chunks
          and indexes them for retrieval. Original files are preserved in
          storage.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Upload a document"
          subtitle="PDF, DOCX, TXT or Markdown. Maximum 20 MB."
        />
        <CardBody>
          <DocumentUpload />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Guidance Library"
          subtitle={`${guidance.length} ${guidance.length === 1 ? 'record' : 'records'}`}
        />
        <CardBody>
          <GuidanceList guidance={guidance} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Raw Uploaded Documents"
          subtitle={`${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`}
        />
        <CardBody>
          <DocumentList documents={documents} />
        </CardBody>
      </Card>
    </div>
  )
}
