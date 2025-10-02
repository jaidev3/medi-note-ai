'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sessionsApi, SessionResponse } from '@/routes'
import { patientsApi, PatientResponse } from '@/routes'
import { documentsApi, DocumentMetadataResponse } from '@/routes'
import { soapApi, SOAPNoteResponse } from '@/routes'
import { ArrowLeft, Edit, Plus, Eye, Download, Trash2 } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

export default function SessionDetailPage() {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [documents, setDocuments] = useState<DocumentMetadataResponse[]>([])
  const [soapNotes, setSoapNotes] = useState<SOAPNoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchSessionData(token)
  }, [sessionId, router])

  const fetchSessionData = async (token: string) => {
    try {
      setLoading(true)
      setError('')
      
      const [sessionData, documentsData, soapNotesData] = await Promise.all([
        sessionsApi.getSession(sessionId, token),
        documentsApi.listSessionDocuments(sessionId, token),
        soapApi.listSessionSOAPNotes(sessionId, token)
      ])
      
      setSession(sessionData)
      
      // Fetch patient data if session has patient_id
      if (sessionData.patient_id) {
        try {
          const patientData = await patientsApi.getPatient(sessionData.patient_id, token)
          setPatient(patientData)
        } catch (error) {
          console.error('Failed to fetch patient data:', error)
        }
      }
      
      // Set documents and SOAP notes with safety checks
      setDocuments(documentsData?.documents || [])
      setSoapNotes(soapNotesData || [])
    } catch (error) {
      console.error('Failed to fetch session data:', error)
      setError('Failed to load session information')
      // Set empty arrays on error to prevent undefined issues
      setDocuments([])
      setSoapNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      await sessionsApi.deleteSession(sessionId, token)
      router.push('/sessions?message=Session deleted successfully')
    } catch (error) {
      console.error('Failed to delete session:', error)
      setError('Failed to delete session')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading session information...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Session</h2>
          <p className="text-slate-600 mb-4">{error || 'Session not found'}</p>
          <Link href="/sessions">
            <Button>Back to Sessions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/sessions" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    S
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Session for {patient?.name || 'Unknown Patient'}
                  </h1>
                  <p className="text-slate-600">Session details and management</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/sessions/${sessionId}/edit`}>
                <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Session
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleDeleteSession}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Session Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Session Details
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Session information and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">Visit Date</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(session.visit_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">Patient</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {patient ? (
                        <Link href={`/patients/${patient.id}`} className="text-slate-900 hover:text-slate-700 underline">
                          {patient.name || 'Unnamed Patient'}
                        </Link>
                      ) : (
                        'Unknown Patient'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">Documents</span>
                    <span className="text-sm font-semibold text-slate-900">{session.document_count}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">SOAP Notes</span>
                    <span className="text-sm font-semibold text-slate-900">{session.soap_note_count}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">Created</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-medium text-slate-700">Last Updated</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {session.notes && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 text-lg mb-4">Session Notes</h4>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-sm text-slate-700">{session.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Common actions for this session
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-3">
                  <Link href={`/documents/upload?session_id=${sessionId}`}>
                    <Button variant="outline" className="w-full h-12 justify-start border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 rounded-2xl font-medium">
                      <Plus className="h-4 w-4 mr-3" />
                      Upload Document
                    </Button>
                  </Link>
                  <Link href={`/soap/generate?session_id=${sessionId}`}>
                    <Button variant="outline" className="w-full h-12 justify-start border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 rounded-2xl font-medium">
                      <Plus className="h-4 w-4 mr-3" />
                      Generate SOAP Note
                    </Button>
                  </Link>
                  <Link href={`/rag/query?session_id=${sessionId}`}>
                    <Button variant="outline" className="w-full h-12 justify-start border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 rounded-2xl font-medium">
                      <Eye className="h-4 w-4 mr-3" />
                      Query Knowledge Base
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </div>

          {/* Documents and SOAP Notes */}
          <div className="lg:col-span-3 space-y-8">
            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Documents ({documents?.length || 0})
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Documents uploaded for this session
                    </CardDescription>
                  </div>
                  <Link href={`/documents/upload?session_id=${sessionId}`}>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                {!documents || documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-200">
                      <span className="text-slate-400 text-2xl font-bold">D</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No documents uploaded</h3>
                    <p className="text-slate-600 mb-6">Upload documents to get started with this session.</p>
                    <Link href={`/documents/upload?session_id=${sessionId}`}>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.document_id} className="border border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900">{doc.document_name}</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              {doc.file_type} • {doc.file_size} bytes
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/documents/${doc.document_id}/view`}>
                              <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 font-medium">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 font-medium">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>

            {/* SOAP Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      SOAP Notes ({soapNotes?.length || 0})
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      SOAP notes generated for this session
                    </CardDescription>
                  </div>
                  <Link href={`/soap/generate?session_id=${sessionId}`}>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate SOAP Note
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                {!soapNotes || soapNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-200">
                      <span className="text-slate-400 text-2xl font-bold">S</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No SOAP notes generated</h3>
                    <p className="text-slate-600 mb-6">Generate SOAP notes to document this session.</p>
                    <Link href={`/soap/generate?session_id=${sessionId}`}>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate SOAP Note
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {soapNotes.map((note) => (
                      <div key={note.note_id} className="border border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900">
                              SOAP Note {note.note_id.slice(0, 8)}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Status: {note.ai_approved ? 'AI Approved' : 'Pending'} • {note.soap_note?.subjective ? '4' : '0'} sections
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/soap/notes/${note.note_id}`}>
                              <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 font-medium">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/soap/notes/${note.note_id}/edit`}>
                              <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 font-medium">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Generated: {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
