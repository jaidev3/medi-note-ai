'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { soapApi, SOAPGenerationRequest, SOAPGenerationResponse } from '@/routes'
import { patientsApi, sessionsApi, PatientResponse, SessionResponse } from '@/routes'
import { FileText, Loader2, CheckCircle, AlertCircle, ArrowLeft, Brain, Settings, Clock, Info, X } from 'lucide-react'

export default function SOAPGenerationPage() {
  const [formData, setFormData] = useState<SOAPGenerationRequest>({
    text: '',
    session_id: '',
    document_id: null as any,
    professional_id: null as any,
    include_context: true,
    max_length: 8000,
    temperature: 0.1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<SOAPGenerationResponse | null>(null)
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [showFullNote, setShowFullNote] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchInitialData(token)
  }, [router])

  const fetchInitialData = async (token: string) => {
    try {
      const [patientsData, sessionsData] = await Promise.all([
        patientsApi.listPatients(token, 1, 100),
        sessionsApi.listSessions(token, 1, 100)
      ])
      console.log('Fetched patients:', patientsData.patients.length)
      console.log('Fetched sessions:', sessionsData.sessions.length)
      console.log('Sessions data:', sessionsData.sessions)
      setPatients(patientsData.patients)
      setSessions(sessionsData.sessions)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setLoading(true)
    setError('')
    setSuccess(false)
    setResult(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Generating SOAP note...
      console.log('Calling SOAP API with token:', token ? 'Token exists' : 'No token')
      const response = await soapApi.generateSOAPNote(formData, token)
      console.log('SOAP API response:', response)
      setResult(response)
      setSuccess(true)
      // SOAP note generated successfully!
    } catch (err: any) {
      console.log('Error details:', err)
      let errorMessage = 'Failed to generate SOAP note'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.detail) {
        errorMessage = err.detail
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err)
      }
      
      setError(errorMessage)
      console.error('SOAP generation error:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    console.log('Input change:', e.target.name, '=', newValue)
    setFormData(prev => ({
      ...prev,
      [e.target.name]: newValue
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Generate SOAP Note</h1>
                    <p className="text-slate-600">AI-powered SOAP note generation from clinical text</p>
                  </div>
                  
                  {/* Information Icon with Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-8 h-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="w-80 p-0 border-0 shadow-xl">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg">
                          {/* Quick Instructions */}
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-900 text-sm mb-3">How to Generate SOAP Notes</h4>
                            <div className="space-y-2 text-xs text-slate-600">
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span>Enter the clinical text, conversation transcript, or notes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                <span>Select the associated patient session</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                                <span>Adjust generation parameters if needed (max length, temperature)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                <span>Enable NER context for better accuracy</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                <span>Click "Generate SOAP Note" to create AI-powered notes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                <span>Review and approve the generated note</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* AI Features */}
                          <div className="pt-3 border-t border-slate-100">
                            <h4 className="font-semibold text-slate-900 text-sm mb-3">AI Features</h4>
                            <div className="space-y-2 text-xs text-slate-600">
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                <span>Automatic SOAP structure generation</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                <span>NER context extraction for accuracy</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                <span>Confidence scoring for each section</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                <span>Professional medical terminology</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form - Takes up most space */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-slate-900">SOAP Note Generation</CardTitle>
                <CardDescription className="text-slate-600">
                  Generate AI-powered SOAP notes from text input with advanced parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label htmlFor="text" className="flex items-center text-sm font-medium text-slate-700">
                      <FileText className="h-4 w-4 mr-2 text-slate-500" />
                      Clinical Text *
                    </label>
                    <textarea
                      id="text"
                      name="text"
                      required
                      rows={10}
                      value={formData.text}
                      onChange={handleInputChange}
                      placeholder="Enter the clinical text, conversation transcript, or notes to generate SOAP note from..."
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="session_id" className="flex items-center text-sm font-medium text-slate-700">
                        <Clock className="h-4 w-4 mr-2 text-slate-500" />
                        Session ID *
                      </label>
                      <select
                        id="session_id"
                        name="session_id"
                        required
                        value={formData.session_id}
                        onChange={handleInputChange}
                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                      >
                        <option value="">Select a session</option>
                        {sessions.map((session) => (
                          <option key={session.session_id} value={session.session_id}>
                            {new Date(session.visit_date).toLocaleDateString()} - Session {session.session_id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>


                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="max_length" className="block text-sm font-medium text-slate-700">
                        Max Length
                      </label>
                      <Input
                        id="max_length"
                        name="max_length"
                        type="number"
                        min={1000}
                        max={15000}
                        value={formData.max_length}
                        onChange={handleInputChange}
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">
                        Temperature
                      </label>
                      <Input
                        id="temperature"
                        name="temperature"
                        type="number"
                        min={0}
                        max={2}
                        step={0.1}
                        value={formData.temperature}
                        onChange={handleInputChange}
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                    <input
                      id="include_context"
                      name="include_context"
                      type="checkbox"
                      checked={formData.include_context}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                    />
                    <label htmlFor="include_context" className="text-sm font-medium text-slate-700">
                      Include NER context for better accuracy
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-sm"
                    disabled={loading || !formData.text || !formData.session_id}
                    onClick={() => console.log('Button clicked, formData:', formData, 'disabled:', loading || !formData.text || !formData.session_id)}
                  >
                    {loading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        Generating SOAP Note...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate SOAP Note
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </div>


          </div>

          {/* Results Panel - Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {success && result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-6 pt-8 px-6">
                  <CardTitle className="text-xl font-bold text-emerald-800">Generated Successfully!</CardTitle>
                  <CardDescription className="text-slate-600">
                    Your SOAP note is ready for review
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6 space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="text-sm text-emerald-700 space-y-2">
                      <div className="flex justify-between">
                        <span>Processing Time:</span>
                        <span className="font-semibold">{result.processing_time}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Approved:</span>
                        <span className="font-semibold">{result.ai_approved ? 'Yes' : 'No'}</span>
                      </div>
                      {result.note_id && (
                        <div className="flex justify-between">
                          <span>Note ID:</span>
                          <span className="font-semibold font-mono text-xs">{result.note_id.slice(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.soap_note && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-blue-100">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Subjective</h4>
                        <p className="text-xs text-slate-700 line-clamp-3">{result.soap_note.subjective.content}</p>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>{(result.soap_note.subjective.confidence * 100).toFixed(1)}%</span>
                          <span>{result.soap_note.subjective.word_count} words</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-100">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Objective</h4>
                        <p className="text-xs text-slate-700 line-clamp-3">{result.soap_note.objective.content}</p>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>{(result.soap_note.objective.confidence * 100).toFixed(1)}%</span>
                          <span>{result.soap_note.objective.word_count} words</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-amber-100">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Assessment</h4>
                        <p className="text-xs text-slate-700 line-clamp-3">{result.soap_note.assessment.content}</p>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>{(result.soap_note.assessment.confidence * 100).toFixed(1)}%</span>
                          <span>{result.soap_note.assessment.word_count} words</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-purple-100">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Plan</h4>
                        <p className="text-xs text-slate-700 line-clamp-3">{result.soap_note.plan.content}</p>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>{(result.soap_note.plan.confidence * 100).toFixed(1)}%</span>
                          <span>{result.soap_note.plan.word_count} words</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.context_data && (
                    <div className="p-4 bg-violet-50 rounded-xl border-l-4 border-violet-100">
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-violet-600" />
                        NER Context
                      </h4>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Entities:</span>
                          <span className="font-semibold">{result.context_data.total_entities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing:</span>
                          <span className="font-semibold">{result.context_data.processing_time}ms</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                      onClick={() => setShowFullNote(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Note
                    </Button>
                    <Button 
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      onClick={() => {
                        // TODO: Implement note approval logic
                        console.log('Approving SOAP note:', result.note_id)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Note
                    </Button>
                  </div>
                </CardContent>
              </div>
            )}

            {/* Preview Card */}
            {!success && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-6 pt-8 px-6">
                  <CardTitle className="text-xl font-bold text-slate-900">AI Preview</CardTitle>
                  <CardDescription className="text-slate-600">
                    Your generated SOAP note will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-slate-200">
                      <Brain className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Generate</h3>
                    <p className="text-slate-500 text-sm">Fill in the form and click generate to create your SOAP note</p>
                  </div>
                </CardContent>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full Note Modal */}
      {showFullNote && result && result.soap_note && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Complete SOAP Note</h2>
                <p className="text-slate-600">Full AI-generated SOAP note for review</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullNote(false)}
                className="w-8 h-8 p-0 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Processing Time</div>
                    <div className="text-sm font-semibold text-slate-900">{result.processing_time}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">AI Approved</div>
                    <div className="text-sm font-semibold text-slate-900">{result.ai_approved ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Regenerations</div>
                    <div className="text-sm font-semibold text-slate-900">{result.regeneration_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Note ID</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">
                      {result.note_id ? result.note_id.slice(0, 8) + '...' : 'Not saved'}
                    </div>
                  </div>
                </div>

                {/* SOAP Sections */}
                <div className="space-y-6">
                  {/* Subjective */}
                  <div className="border border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-900">Subjective</h3>
                      <div className="flex justify-between text-sm text-blue-700 mt-1">
                        <span>Confidence: {(result.soap_note.subjective.confidence * 100).toFixed(1)}%</span>
                        <span>{result.soap_note.subjective.word_count} words</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result.soap_note.subjective.content}
                      </p>
                    </div>
                  </div>

                  {/* Objective */}
                  <div className="border border-emerald-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
                      <h3 className="text-lg font-semibold text-emerald-900">Objective</h3>
                      <div className="flex justify-between text-sm text-emerald-700 mt-1">
                        <span>Confidence: {(result.soap_note.objective.confidence * 100).toFixed(1)}%</span>
                        <span>{result.soap_note.objective.word_count} words</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result.soap_note.objective.content}
                      </p>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="border border-amber-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                      <h3 className="text-lg font-semibold text-amber-900">Assessment</h3>
                      <div className="flex justify-between text-sm text-amber-700 mt-1">
                        <span>Confidence: {(result.soap_note.assessment.confidence * 100).toFixed(1)}%</span>
                        <span>{result.soap_note.assessment.word_count} words</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result.soap_note.assessment.content}
                      </p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="border border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-900">Plan</h3>
                      <div className="flex justify-between text-sm text-purple-700 mt-1">
                        <span>Confidence: {(result.soap_note.plan.confidence * 100).toFixed(1)}%</span>
                        <span>{result.soap_note.plan.word_count} words</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result.soap_note.plan.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NER Context Data */}
                {result.context_data && (
                  <div className="border border-violet-200 rounded-xl overflow-hidden">
                    <div className="bg-violet-50 px-4 py-3 border-b border-violet-200">
                      <h3 className="text-lg font-semibold text-violet-900 flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        NER Context Data
                      </h3>
                      <div className="flex justify-between text-sm text-violet-700 mt-1">
                        <span>Total Entities: {result.context_data.total_entities}</span>
                        <span>Processing: {result.context_data.processing_time}ms</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="text-sm text-slate-700">
                        <p className="mb-2"><strong>Medical entities extracted:</strong></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {result.context_data.entities && result.context_data.entities.map((entity, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {entity.type}
                              </span>
                              <span className="text-slate-800">{entity.value}</span>
                              <span className="text-xs text-slate-500">
                                ({(entity.confidence * 100).toFixed(0)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Feedback */}
                {result.validation_feedback && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900">AI Validation Feedback</h3>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-slate-800 leading-relaxed">
                        {result.validation_feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-600">
                Generated on {new Date().toLocaleString()}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFullNote(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    // TODO: Implement note approval logic
                    console.log('Approving SOAP note:', result.note_id)
                    setShowFullNote(false)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
