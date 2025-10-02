'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { ragApi, RAGQueryRequest, RAGQueryResponse, RAGChunk } from '@/routes'
import { patientsApi, sessionsApi, PatientResponse, SessionResponse } from '@/routes'
import { isTokenExpiredError, handleTokenExpiration } from '@/lib/api-config'
import { Search, Loader2, FileText, Calendar, User, Brain, ArrowLeft, Settings, Clock, Database, AlertCircle, Send, MessageSquare, Bot, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  queryRequest?: RAGQueryRequest
  response?: RAGQueryResponse
  loading?: boolean
}

export default function RAGQueryPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [filters, setFilters] = useState({
    patient_id: '',
    session_id: '',
    start_date: '',
    end_date: '',
  })
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchInitialData(token)
    loadChatHistory()
  }, [router])

  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on every render
    if (chatMessages.length > 0) {
      scrollToBottom()
    }
  }, [chatMessages.length])

  const fetchInitialData = async (token: string) => {
    try {
      const [patientsData, sessionsData] = await Promise.all([
        patientsApi.listPatients(token, 1, 100),
        sessionsApi.listSessions(token, 1, 100)
      ])
      setPatients(patientsData.patients)
      setSessions(sessionsData.sessions)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      if (isTokenExpiredError(error)) {
        handleTokenExpiration()
        return
      }
    }
  }

  const loadChatHistory = () => {
    const saved = localStorage.getItem('rag_chat_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setChatMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
  }

  const saveChatHistory = (messages: ChatMessage[]) => {
    localStorage.setItem('rag_chat_history', JSON.stringify(messages))
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentQuery.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuery,
      timestamp: new Date()
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    }

    const newMessages = [...chatMessages, userMessage, assistantMessage]
    setChatMessages(newMessages)
    saveChatHistory(newMessages)
    setCurrentQuery('')
    setLoading(true)
    setError('') // Clear any previous errors

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }
      

      const queryRequest: RAGQueryRequest = {
        query: currentQuery,
        // Only include optional filters when they have values. JSON.stringify omits undefined.
        patient_id: filters.patient_id || undefined,
        session_id: filters.session_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        // Add default values for better matching
        similarity_threshold: 0.1,
        top_k: 5,
        rerank_top_n: 3,
        include_sources: true
      }

      // Searching knowledge base...
      const response = await ragApi.queryKnowledgeBase(queryRequest, token)
      
      // Check if response is successful and has content
      if (!response.success) {
        throw new Error(response.message || 'RAG query failed')
      }
      
      if (!response.answer || response.answer.trim() === '') {
        throw new Error('No answer received from knowledge base')
      }
      
      // Update the assistant message with the response
      const updatedMessages = newMessages.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: response.answer, response, queryRequest, loading: false }
          : msg
      )
      
      setChatMessages(updatedMessages)
      saveChatHistory(updatedMessages)
              // Response received successfully!
    } catch (err: any) {
      console.error('RAG query error:', err)
      
      // Check if token expired
      if (isTokenExpiredError(err)) {
        handleTokenExpiration()
        return
      }
      
      const errorMessage = err.message || 'Failed to get response from knowledge base'
      const updatedMessages = newMessages.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: `Error: ${errorMessage}`, loading: false }
          : msg
      )
      setChatMessages(updatedMessages)
      saveChatHistory(updatedMessages)
              // Error: ${errorMessage}
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setChatMessages([])
    localStorage.removeItem('rag_chat_history')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border rounded-lg flex items-center justify-center shadow-sm">
                  <Brain className="h-4 w-4 text-slate-700" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Knowledge Base Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                {sidebarExpanded ? <ChevronLeft className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                {sidebarExpanded ? 'Collapse' : 'Expand'} Sidebar
              </Button>
              <Button 
                variant="outline" 
                onClick={clearChat}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Clear Chat
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  patient_id: '',
                  session_id: '',
                  start_date: '',
                  end_date: '',
                })}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column - Collapsible Sidebar */}
        <div 
          className={`bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarExpanded ? 'w-96' : 'w-16'
          }`}
        >
          {sidebarExpanded ? (
            <div className="p-6 h-full overflow-y-auto">
              <Card className="border-0 shadow-sm bg-white mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Settings className="h-5 w-5 text-slate-700" />
                    </div>
                    Search Filters
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure your search parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Patient (Optional)
                      </label>
                      <select
                        value={filters.patient_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, patient_id: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                      >
                        <option value="">All patients</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name || 'Unnamed Patient'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        Session (Optional)
                      </label>
                      <select
                        value={filters.session_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, session_id: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                      >
                        <option value="">All sessions</option>
                        {sessions.map((session) => (
                          <option key={session.session_id} value={session.session_id}>
                            {formatDate(session.visit_date)} - Session {session.session_id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date (Optional)
                        </label>
                        <Input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                          className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          End Date (Optional)
                        </label>
                        <Input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                          className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions Card */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
                      <Brain className="h-5 w-5 text-violet-700" />
                    </div>
                    Example Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm">
                    <button
                      onClick={() => {
                        const question = "What were the patient's hearing test results from their last visit?"
                        setCurrentQuery(question)
                        // Focus the input field after a short delay to ensure state update
                        setTimeout(() => {
                          const input = document.querySelector('input[placeholder*="Ask a question"]') as HTMLInputElement
                          if (input) {
                            input.focus()
                            input.scrollIntoView({ behavior: 'smooth' })
                          }
                        }, 100)
                      }}
                      className={`text-left p-4 rounded-lg transition-all duration-200 w-full border ${
                        currentQuery === "What were the patient's hearing test results from their last visit?"
                          ? 'bg-violet-100 border-violet-300 text-violet-800'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      "What were the patient's hearing test results from their last visit?"
                    </button>
                    <button
                      onClick={() => {
                        const question = "Show me all SOAP notes mentioning tinnitus"
                        setCurrentQuery(question)
                        setTimeout(() => {
                          const input = document.querySelector('input[placeholder*="Ask a question"]') as HTMLInputElement
                          if (input) {
                            input.focus()
                            input.scrollIntoView({ behavior: 'smooth' })
                          }
                        }, 100)
                      }}
                      className={`text-left p-4 rounded-lg transition-all duration-200 w-full border ${
                        currentQuery === "Show me all SOAP notes mentioning tinnitus"
                          ? 'bg-violet-100 border-violet-300 text-violet-800'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      "Show me all SOAP notes mentioning tinnitus"
                    </button>
                    <button
                      onClick={() => {
                        const question = "What treatments were recommended for hearing loss?"
                        setCurrentQuery(question)
                        setTimeout(() => {
                          const input = document.querySelector('input[placeholder*="Ask a question"]') as HTMLInputElement
                          if (input) {
                            input.focus()
                            input.scrollIntoView({ behavior: 'smooth' })
                          }
                        }, 100)
                      }}
                      className={`text-left p-4 rounded-lg transition-all duration-200 w-full border ${
                        currentQuery === "What treatments were recommended for hearing loss?"
                          ? 'bg-violet-100 border-violet-300 text-violet-800'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      "What treatments were recommended for hearing loss?"
                    </button>
                  </div>
                  {/* Debug info - remove in production */}
                  <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
                    Current query: {currentQuery || 'None'}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <Settings className="h-5 w-5 text-emerald-700" />
                    </div>
                    How to Use Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                      <span>Optionally filter by patient, session, or date range</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span>Type your question and send</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                      <span>Chat history is automatically saved</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                      <span>All search parameters are automatically optimized</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Example Questions Card */}
             
            </div>
          ) : (
            /* Collapsed Sidebar - Show only icons and minimal info */
            <div className="h-full flex flex-col items-center py-6 space-y-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-slate-700" />
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-violet-700" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Chat Interface */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8">
            {chatMessages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-8 flex items-center justify-center shadow-sm border border-slate-200">
                  <Brain className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Start a Conversation</h3>
                <p className="text-gray-500 text-lg">Optionally set filters and ask your first question</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-4 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {message.type === 'user' ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div className={`rounded-xl p-5 ${
                        message.type === 'user' 
                          ? 'bg-slate-100 text-slate-900' 
                          : 'bg-emerald-50 text-gray-900 border border-emerald-200'
                      }`}>
                        {message.loading ? (
                          <div className="flex items-center space-x-3">
                            <Loading size="sm" />
                            <span className="text-lg">Thinking...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-base leading-relaxed">{message.content}</p>
                            
                            {/* Show sources if available */}
                            {message.response?.retrieved_chunks && message.response.retrieved_chunks.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-emerald-200">
                                <p className="text-sm font-medium text-emerald-700 mb-3">Sources:</p>
                                <div className="space-y-3">
                                  {message.response.retrieved_chunks.slice(0, 2).map((chunk, index) => (
                                    <div key={chunk.chunk_id} className="text-sm bg-white p-3 rounded-lg border border-emerald-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Source {index + 1}</span>
                                        <span className="text-emerald-600">
                                          {(chunk.similarity_score * 100).toFixed(1)}% match
                                        </span>
                                      </div>
                                      <p className="text-gray-600 line-clamp-3">{chunk.content}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Show processing time if available */}
                            {message.response?.processing_time && (
                              <div className="text-sm text-emerald-600 pt-3 border-t border-emerald-200">
                                Processed in {message.response.processing_time}ms
                              </div>
                            )}
                            
                            {/* Debug info - show response details */}
                            {message.response && (
                              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                <div>Success: {message.response.success.toString()}</div>
                                <div>Chunks found: {message.response.total_chunks_found}</div>
                                <div>Confidence: {message.response.confidence}</div>
                                <div>Message: {message.response.message}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-100 p-8 bg-white flex-shrink-0">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg text-sm flex items-center max-w-4xl mx-auto">
                <AlertCircle className="h-5 w-5 mr-3" />
                {error}
              </div>
            )}
            
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <Input
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  placeholder="Ask a question about your patient data..."
                  className="flex-1 border-gray-200 focus:border-slate-600 focus:ring-slate-600 h-12 text-base"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !currentQuery.trim()}
                  className="border hover:bg-slate-200 shadow-sm h-12 px-6"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
