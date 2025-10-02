'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingPage } from '@/components/ui/loading'
import { authApi, usersApi, UserProfile, UserStatsResponse } from '@/routes'
import { 
  Users, 
  FileText, 
  Upload, 
  Search, 
  Settings, 
  LogOut,
  Plus,
  Calendar,
  Activity,
  Target,
  Link as LinkIcon,
  Eye,
  HelpCircle,
  Home
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchUserData = async () => {
      try {
        const [userData, statsData] = await Promise.all([
          authApi.getCurrentUser(token),
          usersApi.getUserStats(token)
        ])
        setUser(userData)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        localStorage.removeItem('access_token')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        await authApi.logout(token)
        // Logged out successfully!
      } catch (error) {
        console.error('Logout error:', error)
        // Logout failed
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (loading) {
    return <LoadingPage text="Loading dashboard..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Echo Notes</h1>
                <p className="text-slate-600">AI-powered hearing care documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {user.name}!
              </h2>
              <p className="text-slate-600 text-lg">
                Here's an overview of your clinical activities and quick access to key features.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-600">Total Patients</p>
                    <p className="text-xl font-medium text-slate-900">{stats.total_patients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-600">Total Sessions</p>
                    <p className="text-xl font-medium text-slate-900">{stats.total_sessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-600">Total SOAP Notes</p>
                    <p className="text-xl font-medium text-slate-900">{stats.total_soap_notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Upload className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-600">Documents</p>
                    <p className="text-xl font-medium text-slate-900">{stats.total_documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/patients">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    Manage Patients
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    View all patients and add new patient records
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/sessions">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    Manage Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    View all sessions and schedule new patient visits
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/documents/upload">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <Upload className="h-4 w-4 text-orange-600" />
                    </div>
                    Upload Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    Upload and process patient documents
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/soap/generate">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    Generate SOAP Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    Create AI-powered SOAP notes from text or documents
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/rag/query">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <Search className="h-4 w-4 text-indigo-600" />
                    </div>
                    Query Knowledge Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    Search through patient records and SOAP notes
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <Link href="/settings">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Settings className="h-4 w-4 text-slate-600" />
                    </div>
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-slate-600">
                    Manage your profile and preferences
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <span>Recent sessions: {stats?.recent_sessions || 0}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span>Recent SOAP notes: {stats?.recent_soap_notes || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
