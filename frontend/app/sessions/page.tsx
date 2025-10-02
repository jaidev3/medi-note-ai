'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sessionsApi, SessionResponse, SessionListResponse } from '@/routes'
import { patientsApi, PatientResponse } from '@/routes'
import { professionalsApi, ProfessionalResponse } from '@/routes/professionals'
import { Plus, Search, Eye, Edit, Trash2, Calendar, User, FileText, Activity, Clock, UserCheck, Stethoscope, Heart, Brain, Ear } from 'lucide-react'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchInitialData(token)
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchSessions(token)
    }
  }, [currentPage, selectedPatientId, selectedProfessionalId])

  const fetchInitialData = async (token: string) => {
    try {
      const [patientsData, professionalsData] = await Promise.all([
        patientsApi.listPatients(token, 1, 100),
        professionalsApi.listProfessionals(token, 1, 100)
      ])
      setPatients(patientsData.patients)
      setProfessionals(professionalsData.professionals)
      fetchSessions(token)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

  const fetchSessions = async (token: string) => {
    try {
      setLoading(true)
      const response = await sessionsApi.listSessions(
        token, 
        currentPage, 
        pageSize, 
        selectedPatientId || undefined,
        selectedProfessionalId || undefined
      )
      setSessions(response.sessions)
      setTotalCount(response.total_count)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchSessions(localStorage.getItem('access_token') || '')
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      await sessionsApi.deleteSession(sessionId, token)
      fetchSessions(token)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    return patient?.name || 'Unknown Patient'
  }

  const getProfessionalName = (professionalId?: string) => {
    if (!professionalId) return 'Unassigned'
    const professional = professionals.find(p => p.id === professionalId)
    return professional?.name || 'Unknown Professional'
  }

  const getProfessionalRole = (professionalId?: string) => {
    if (!professionalId) return 'Unassigned'
    const professional = professionals.find(p => p.id === professionalId)
    return professional?.role || 'Unknown Role'
  }

  const getSpecialistIcon = (role: string) => {
    switch (role) {
      case 'Audiologists':
        return <Ear className="h-4 w-4" />
      case 'ENT Physicians':
        return <Stethoscope className="h-4 w-4" />
      case 'Hearing Aid Specialists':
        return <Heart className="h-4 w-4" />
      case 'Clinical Support Staff':
        return <Brain className="h-4 w-4" />
      default:
        return <UserCheck className="h-4 w-4" />
    }
  }

  const getSpecialistColor = (role: string) => {
    switch (role) {
      case 'Audiologists':
        return 'text-blue-600 bg-blue-100'
      case 'ENT Physicians':
        return 'text-green-600 bg-green-100'
      case 'Hearing Aid Specialists':
        return 'text-purple-600 bg-purple-100'
      case 'Clinical Support Staff':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                ← Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                
                <h1 className="text-xl font-semibold text-gray-900">Patient Sessions</h1>
              </div>
            </div>
            <Link href="/sessions/new">
              <Button className="border hover:bg-slate-200 shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Stats Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-slate-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Patients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.from(new Set(sessions.map(s => s.patient_id))).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-violet-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessions.reduce((sum, s) => sum + s.document_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-cyan-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Professionals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.from(new Set(sessions.map(s => s.professional_id).filter(Boolean))).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Sessions
                  </label>
                  <Input
                    id="search"
                    placeholder="Search by notes or session details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label htmlFor="patient_filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Patient
                  </label>
                  <select
                    id="patient_filter"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                  >
                    <option value="">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name || 'Unnamed Patient'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="professional_filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Professional
                  </label>
                  <select
                    id="professional_filter"
                    value={selectedProfessionalId}
                    onChange={(e) => setSelectedProfessionalId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                  >
                    <option value="">All Professionals</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name} - {professional.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sessions.map((session) => (
            <Card key={session.session_id} className="border-0 shadow-sm bg-white hover:shadow-md transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm border border-emerald-200">
                      <User className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {getPatientName(session.patient_id)}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(session.visit_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/sessions/${session.session_id}`}>
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/sessions/${session.session_id}/edit`}>
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSession(session.session_id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${getSpecialistColor(getProfessionalRole(session.professional_id))}`}>
                      {getSpecialistIcon(getProfessionalRole(session.professional_id))}
                    </div>
                    <span className="font-medium">{getProfessionalName(session.professional_id)}</span>
                    <span className="text-gray-500 ml-2">•</span>
                    <span className="text-gray-500">{getProfessionalRole(session.professional_id)}</span>
                  </div>
                  
                  {session.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {session.notes.length > 100 ? `${session.notes.substring(0, 100)}...` : session.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600 p-2 bg-violet-50 rounded-lg border border-violet-100">
                      <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center mr-2">
                        <FileText className="h-3 w-3 text-violet-600" />
                      </div>
                      <span><strong>{session.document_count}</strong> documents</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                        <FileText className="h-3 w-3 text-indigo-600" />
                      </div>
                      <span><strong>{session.soap_note_count}</strong> SOAP notes</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                      <Clock className="h-2 w-2 text-amber-600" />
                    </div>
                    Created: {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex justify-center items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    if (totalPages <= 5) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "border hover:bg-slate-200 shadow-sm" : "border-gray-200 text-gray-700 hover:bg-gray-50"}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
              
              <div className="text-center mt-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages} • {totalCount} total sessions
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {sessions.length === 0 && !loading && (
          <Card className="border-0 shadow-sm bg-white text-center py-16">
            <CardContent>
              <div className="text-gray-500">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-slate-200">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No sessions found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {selectedPatientId ? 'This patient has no sessions yet.' : 'Get started by creating your first patient session to begin documenting patient care.'}
                </p>
                <Link href="/sessions/new">
                  <Button className="border hover:bg-slate-200 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
