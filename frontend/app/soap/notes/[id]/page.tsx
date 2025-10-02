'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, LoadingPage } from '@/components/ui/loading'
import { soapApi, SOAPNoteResponse } from '@/routes'
import { sessionsApi, SessionResponse } from '@/routes'
import { patientsApi, PatientResponse } from '@/routes'
import { documentsApi, DocumentContentResponse } from '@/routes'
import { ragApi } from '@/routes'
import { ArrowLeft, Edit, CheckCircle, Clock, Plus, Eye, Download, Save, RefreshCw, Info, Settings, FileText, UserCheck, Brain } from 'lucide-react'

export default function SOAPNoteDetailPage() {
  const [soapNote, setSoapNote] = useState<SOAPNoteResponse | null>(null)
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [documentContent, setDocumentContent] = useState<DocumentContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [embedding, setEmbedding] = useState(false)
  const [editContent, setEditContent] = useState<Record<string, any>>({})
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchSOAPNoteData(token)
  }, [noteId, router])

  const fetchSOAPNoteData = async (token: string) => {
    try {
      setLoading(true)
      
      const noteData = await soapApi.getSOAPNote(noteId, token)
      setSoapNote(noteData)
      setEditContent(noteData.content || {})
      
      // Fetch session data if note has session_id
      if (noteData.session_id) {
        try {
          const sessionData = await sessionsApi.getSession(noteData.session_id, token)
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
        } catch (error) {
          console.error('Failed to fetch session data:', error)
        }
      }

      // Fetch document content if note has document_id
      if (noteData.document_id) {
        try {
          const contentData = await documentsApi.getDocumentContent(noteData.document_id, token)
          setDocumentContent(contentData)
        } catch (error) {
          console.error('Failed to fetch document content:', error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch SOAP note data:', error)
      setError('Failed to load SOAP note information')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true)
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Approving SOAP note...
      await soapApi.approveSOAPNote(noteId, true, token)
      
      // SOAP note approved successfully!
      
      // Trigger RAG embedding after approval
      await triggerRAGEmbedding(token)
      
      // Refresh the note data
      fetchSOAPNoteData(token)
      
      // Close the confirmation dialog
      setShowApproveConfirm(false)
    } catch (error) {
      console.error('Failed to approve SOAP note:', error)
      // Error: Failed to approve SOAP note
    } finally {
      setApproving(false)
    }
  }

  const handleEdit = () => {
    // Ensure we have the latest content loaded for editing
    if (soapNote) {
      // Initialize editContent with existing content, preserving the structure
      const existingContent = soapNote.content || {}
      
      // Create a comprehensive edit content object
      const newEditContent = { ...existingContent }
      
      // Add content from sections array if available
      if (soapNote.sections && Array.isArray(soapNote.sections)) {
        soapNote.sections.forEach(section => {
          if (section.section_type && section.content) {
            newEditContent[section.section_type] = section.content
          }
        })
      }
      
      // Add content from soap_note object if available
      if (soapNote.soap_note && typeof soapNote.soap_note === 'object') {
        const soapNoteObj = soapNote.soap_note
        if (soapNoteObj.subjective?.content) {
          newEditContent.subjective = soapNoteObj.subjective.content
        }
        if (soapNoteObj.objective?.content) {
          newEditContent.objective = soapNoteObj.objective.content
        }
        if (soapNoteObj.assessment?.content) {
          newEditContent.assessment = soapNoteObj.assessment.content
        }
        if (soapNoteObj.plan?.content) {
          newEditContent.plan = soapNoteObj.plan.content
        }
      }
      
      setEditContent(newEditContent)
    }
    
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setEditing(false)
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Saving changes...
      await soapApi.updateSOAPNote(noteId, {
        content: editContent,
        modification_reason: 'User edited SOAP note content'
      }, token)

      // SOAP note updated successfully!

      // Trigger RAG embedding after edit
      await triggerRAGEmbedding(token)
      
      // Refresh the note data
      fetchSOAPNoteData(token)
    } catch (error) {
      console.error('Failed to save SOAP note:', error)
      // Error: Failed to save SOAP note
      setEditing(true) // Revert to editing mode on error
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditContent(soapNote?.content || {})
  }

  const triggerRAGEmbedding = async (token: string) => {
    try {
      setEmbedding(true)
      // Processing RAG embedding...
      await ragApi.embedSOAPNote({
        note_id: noteId,
        force_reembed: true
      }, token)
      // RAG embedding completed successfully!
    } catch (error) {
      console.error('Failed to trigger RAG embedding:', error)
      // Error: Failed to process RAG embedding
    } finally {
      setEmbedding(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Generating PDF...
      await soapApi.exportSOAPNotePDF(noteId, token)
      // PDF exported successfully!
    } catch (error) {
      console.error('Failed to export PDF:', error)
      // Error: Failed to export PDF
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    const normalized = (status ?? 'unknown')?.toString()?.toLowerCase()
    switch (normalized) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved
          </span>
        )
      case 'pending_approval':
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-800">
            <Clock className="h-4 w-4 mr-2" />
            Pending Approval
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-800">
            Draft
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-800">
            {normalized}
          </span>
        )
    }
  }

  const resolveStatus = (note: SOAPNoteResponse | null): string => {
    if (!note) return 'unknown'
    
    // If there's an explicit status, use it
    if (note.status) return note.status
    
    // Otherwise, derive status from approval flags
    if (note.user_approved) return 'approved'
    if (note.ai_approved && !note.user_approved) return 'pending_approval'
    return 'draft'
  }

  const renderSOAPSection = (sectionType: string, title: string) => {
    let content = ''
    
    // Strategy 1: Try to get content from the main content object
    if (soapNote?.content && typeof soapNote.content === 'object') {
      const directContent = soapNote.content[sectionType]
      if (directContent) {
        if (typeof directContent === 'string') {
          content = directContent
        } else if (typeof directContent === 'object') {
          // Try to extract content from nested object
          if (directContent.content) {
            content = String(directContent.content)
          } else if (directContent.text) {
            content = String(directContent.text)
          } else if (directContent.value) {
            content = String(directContent.value)
          } else {
            content = JSON.stringify(directContent)
          }
        } else {
          content = String(directContent)
        }
      }
    }
    
    // Strategy 2: Check sections array
    if (!content && soapNote?.sections && Array.isArray(soapNote.sections)) {
      const section = soapNote.sections.find(s => s.section_type === sectionType)
      if (section) {
        if (typeof section.content === 'string') {
          content = section.content
        } else if (section.content && typeof section.content === 'object') {
          content = String(section.content)
        }
      }
    }
    
    // Strategy 3: Check soap_note object
    if (!content && soapNote?.soap_note && typeof soapNote.soap_note === 'object') {
      const soapNoteObj = soapNote.soap_note
      let soapSection: any = null
      
      // Access the specific section based on sectionType
      if (sectionType === 'subjective' && soapNoteObj.subjective) {
        soapSection = soapNoteObj.subjective
      } else if (sectionType === 'objective' && soapNoteObj.objective) {
        soapSection = soapNoteObj.objective
      } else if (sectionType === 'assessment' && soapNoteObj.assessment) {
        soapSection = soapNoteObj.assessment
      } else if (sectionType === 'plan' && soapNoteObj.plan) {
        soapSection = soapNoteObj.plan
      }
      
      if (soapSection) {
        if (typeof soapSection === 'string') {
          content = soapSection
        } else if (typeof soapSection === 'object' && soapSection.content) {
          content = String(soapSection.content)
        } else {
          content = String(soapSection)
        }
      }
    }
    
    // Strategy 4: Try to find any content that might match the section type
    if (!content && soapNote?.content && typeof soapNote.content === 'object') {
      const allContent = soapNote.content
      for (const [key, value] of Object.entries(allContent)) {
        if (key.toLowerCase().includes(sectionType.toLowerCase())) {
          if (typeof value === 'string') {
            content = value
          } else if (typeof value === 'object') {
            content = JSON.stringify(value)
          }
          break
        }
      }
    }
    
    // For editing mode, use editContent if available
    if (editing && editContent[sectionType]) {
      content = typeof editContent[sectionType] === 'string' ? editContent[sectionType] : String(editContent[sectionType])
    }
    
    // Final fallback - if we still don't have content, show a helpful message
    if (!content) {
      content = `No ${sectionType} information available.`
    }

    // Get subtle colors for each SOAP section
    const getSectionColors = (type: string) => {
      switch (type.toLowerCase()) {
        case 'subjective':
          return {
            border: 'border-l-4 border-blue-100',
            icon: 'bg-blue-50 text-blue-400',
            text: 'text-blue-600'
          }
        case 'objective':
          return {
            border: 'border-l-4 border-emerald-100',
            icon: 'bg-emerald-50 text-emerald-400',
            text: 'text-emerald-600'
          }
        case 'assessment':
          return {
            border: 'border-l-4 border-amber-100',
            icon: 'bg-amber-50 text-amber-400',
            text: 'text-amber-600'
          }
        case 'plan':
          return {
            border: 'border-l-4 border-purple-100',
            icon: 'bg-purple-50 text-purple-400',
            text: 'text-purple-600'
          }
        default:
          return {
            border: 'border-l-4 border-slate-200',
            icon: 'bg-slate-50 text-slate-400',
            text: 'text-slate-600'
          }
      }
    }

    const colors = getSectionColors(sectionType)
    
    return (
      <div className={`${colors.border} pl-6 py-4`}>
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 ${colors.icon} rounded-lg flex items-center justify-center mr-3`}>
            <span className={`${colors.text} text-sm font-bold`}>{title.charAt(0)}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setEditContent(prev => ({
              ...prev,
              [sectionType]: e.target.value
            }))}
            className="w-full h-24 p-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
            placeholder={`Enter ${sectionType.toLowerCase()} information...`}
          />
        ) : (
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <LoadingPage text="Loading SOAP note..." />
  }

  if (error || !soapNote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading SOAP Note</h2>
          <p className="text-slate-600 mb-4">{error || 'SOAP note not found'}</p>
          <Link href="/soap/generate">
            <Button>Back to SOAP Generation</Button>
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
                href="/soap/generate" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">S</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    SOAP Note {patient ? `- ${patient.name}` : `- Patient ${noteId.slice(0, 8)}`}
                  </h1>
                  <p className="text-slate-600">
                    {patient ? `${patient.name}'s clinical assessment and treatment plan` : 'SOAP note details and management'}
                  </p>
                </div>
                <div className="ml-4">
                  {getStatusBadge(resolveStatus(soapNote))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white">
                    <Save className="h-4 w-4 mr-2 text-white" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleEdit} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Note
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        {/* Top Action Bar - Key Actions and Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side - Status and Patient Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">AI Status:</span>
                  {soapNote?.ai_approved ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending AI Review
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">Patient:</span>
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
              </div>
            </div>

            {/* Right Side - Key Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Approve Button */}
              {soapNote && !soapNote.user_approved ? (
                <Button 
                  onClick={() => setShowApproveConfirm(true)} 
                  disabled={approving}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold px-6"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {approving ? 'Approving...' : 'Approve Note'}
                </Button>
              ) : (
                <Button variant="outline" disabled className="h-11 bg-slate-50 text-slate-700 border-slate-200 rounded-xl px-6">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Approved
                </Button>
              )}

              {/* Embed Button */}
              <Button 
                variant="outline" 
                className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6"
                onClick={() => triggerRAGEmbedding(localStorage.getItem('access_token') || '')}
                disabled={embedding}
              >
                {embedding ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Embedding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-embed
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main SOAP Content - Takes up most space */}
          <div className="lg:col-span-2 space-y-8">
            {/* SOAP Note Sections */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-slate-900">SOAP Note</CardTitle>
                <CardDescription className="text-slate-600">Clinical assessment and treatment plan</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-6">
                  {renderSOAPSection('subjective', 'Subjective')}
                  {renderSOAPSection('objective', 'Objective')}
                  {renderSOAPSection('assessment', 'Assessment')}
                  {renderSOAPSection('plan', 'Plan')}
                </div>
              </CardContent>
            </div>

            {/* Additional Notes */}
            {soapNote.notes && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-6 pt-8 px-8">
                  <CardTitle className="text-xl font-bold text-slate-900">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-8 pb-8">
                  <div className="prose max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">{soapNote.notes}</p>
                  </div>
                </CardContent>
              </div>
            )}

            {/* Document Content Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold text-slate-900">Source Document</CardTitle>
                <CardDescription className="text-slate-600">
                  Original text extracted from the uploaded document
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                {documentContent?.content ? (
                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl p-6 bg-slate-50">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {documentContent.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No document content available</p>
                )}
              </CardContent>
            </div>
          </div>

          {/* Right Sidebar - Additional Info and Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Note Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-bold text-slate-900">Note Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    <div className="text-sm font-semibold text-slate-900">{getStatusBadge(resolveStatus(soapNote))}</div>
                  </div>

                  {session && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Session</div>
                      <div className="text-sm font-semibold text-slate-900">
                        <Link href={`/sessions/${session.session_id}`} className="text-slate-900 hover:text-slate-700 underline">
                          {new Date(session.visit_date).toLocaleDateString()}
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 mb-1">Generated</div>
                    <div className="text-sm font-semibold text-slate-900">{new Date(soapNote?.created_at || '').toLocaleDateString()}</div>
                  </div>

                  {soapNote.updated_at && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Last Updated</div>
                      <div className="text-sm font-semibold text-slate-900">{new Date(soapNote.updated_at).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 justify-start border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm"
                    onClick={() => handleExportPDF()}
                  >
                    <Download className="h-4 w-4 mr-3" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="w-full h-10 justify-start border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm">
                    <Eye className="h-4 w-4 mr-3" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Confirmation Dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowApproveConfirm(false)}
          />
          
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-slate-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Approve SOAP Note
              </h3>
              
              {/* Description */}
              <p className="text-slate-600 mb-6">
                Are you sure you want to approve this SOAP note? This action cannot be undone.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowApproveConfirm(false)}
                  className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {approving ? (
                    <>
                      <Loading size="sm" className="mr-2 text-white" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
