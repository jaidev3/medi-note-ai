'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { patientsApi, PatientResponse } from '@/routes'
import { Plus, Search, Eye, Edit, Calendar, Users, User, Mail, Phone, MapPin, Clock, Activity } from 'lucide-react'

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  const router = useRouter()

  // Deterministic subtle color selection for patient avatar badges,
  // using only static Tailwind classes to ensure they are included in the build.
  const avatarColorClasses: string[] = [
    'bg-indigo-100 border-indigo-200 text-indigo-700',
    'bg-rose-100 border-rose-200 text-rose-700',
    'bg-emerald-100 border-emerald-200 text-emerald-700',
    'bg-amber-100 border-amber-200 text-amber-700',
    'bg-violet-100 border-violet-200 text-violet-700',
    'bg-cyan-100 border-cyan-200 text-cyan-700',
    'bg-sky-100 border-sky-200 text-sky-700',
    'bg-purple-100 border-purple-200 text-purple-700',
    'bg-blue-100 border-blue-200 text-blue-700',
    'bg-orange-100 border-orange-200 text-orange-700',
  ]

  const getAvatarColor = (name?: string | null): string => {
    if (!name) return avatarColorClasses[0]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    }
    return avatarColorClasses[hash % avatarColorClasses.length]
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchPatients(token)
  }, [currentPage, searchTerm, router])

  const fetchPatients = async (token: string) => {
    try {
      setLoading(true)
      const response = await patientsApi.listPatients(token, currentPage, pageSize, searchTerm)
      setPatients(response.patients)
      setTotalCount(response.total_count)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
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
              <Link href="/dashboard" className="text-gray-500 border border-gray-200 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                ← Back to Dashboard
              </Link>
          
                <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
              </div>
      
            <Link href="/patients/new">
              <Button className="border hover:bg-slate-200 shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-2 px-6">
        {/* Stats Overview */}

        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-sm bg-white border border-gray-200">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>
              <Button type="submit" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-gray-300 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-slate-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Patients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {patients.filter(p => p.last_visit && new Date(p.last_visit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-violet-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {patients.filter(p => p.last_visit && new Date(p.last_visit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Patients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border ${getAvatarColor(patient.name)}`}>
                      <span className="font-semibold text-lg">
                        {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-slate-700 transition-colors">
                        {patient.name || 'Unnamed Patient'}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {patient.email || 'No email provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    Active
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  {patient.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center mr-2">
                        <Phone className="h-3 w-3 text-sky-600" />
                      </div>
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center mr-2">
                        <MapPin className="h-3 w-3 text-rose-600" />
                      </div>
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600 p-2 bg-violet-50 rounded-lg border border-violet-100">
                    <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center mr-2">
                      <Activity className="h-3 w-3 text-violet-600" />
                    </div>
                    <span><strong>{patient.total_visits || 0}</strong> visits</span>
                  </div>
                  {patient.last_visit && (
                    <div className="flex items-center text-sm text-gray-600 p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                        <Calendar className="h-3 w-3 text-amber-600" />
                      </div>
                      <span>Last: {new Date(patient.last_visit).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center mr-2">
                      <Clock className="h-2 w-2 text-slate-600" />
                    </div>
                    Added: {new Date(patient.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/patients/${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
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
                          className={currentPage === pageNum ? "bg-slate-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}
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
              
              <div className="text-center mt-4 text-sm text-gray-600 border border-gray-200">
                Page {currentPage} of {totalPages} • {totalCount} total patients
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {patients.length === 0 && !loading && (
          <Card className="border border-gray-300 shadow-sm bg-white text-center py-16">
            <CardContent>
              <div className="text-gray-500">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-slate-200">
                  <Users className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No patients found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm ? 'Try adjusting your search terms or clear the search to see all patients.' : 'Get started by adding your first patient to begin managing their care journey.'}
                </p>
                <Link href="/patients/new">
                  <Button className="hover:bg-slate-200 shadow-sm border border-gray-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Patient
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
