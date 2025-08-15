"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Download, RefreshCw, Users, Database, AlertTriangle, Eye, Calendar, HardDrive } from "lucide-react"
import { AdminUtils, type UserDataSummary } from "@/lib/admin-utils"

export default function AdminPage() {
  const [users, setUsers] = useState<UserDataSummary[]>([])
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const loadData = () => {
    setUsers(AdminUtils.getAllUsersData())
    setStorageInfo(AdminUtils.getStorageInfo())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete all data for user ${userId}?`)) {
      return
    }

    setIsLoading(true)
    const success = AdminUtils.deleteUserData(userId)

    if (success) {
      alert(`User ${userId} deleted successfully`)
      loadData()
      // Refresh page if current user was deleted
      if (localStorage.getItem("retinal-ai-user")) {
        const currentUser = JSON.parse(localStorage.getItem("retinal-ai-user") || "{}")
        if (currentUser.id === userId) {
          window.location.href = "/"
        }
      }
    } else {
      alert("Failed to delete user")
    }
    setIsLoading(false)
  }

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      alert("No users selected")
      return
    }

    if (!confirm(`Delete ${selectedUsers.size} users and all their data?`)) {
      return
    }

    setIsLoading(true)
    let successCount = 0

    selectedUsers.forEach((userId) => {
      if (AdminUtils.deleteUserData(userId)) {
        successCount++
      }
    })

    alert(`Deleted ${successCount}/${selectedUsers.size} users`)
    setSelectedUsers(new Set())
    loadData()
    setIsLoading(false)
  }

  const handleClearAllData = async () => {
    if (confirmText !== "DELETE ALL DATA") {
      alert('Please type "DELETE ALL DATA" to confirm')
      return
    }

    if (!confirm("This will delete ALL user data and cannot be undone!")) {
      return
    }

    setIsLoading(true)
    const success = AdminUtils.clearAllData()

    if (success) {
      alert("All data cleared successfully")
      setConfirmText("")
      loadData()
      // Redirect to home since all users are deleted
      window.location.href = "/"
    } else {
      alert("Failed to clear data")
    }
    setIsLoading(false)
  }

  const handleExportUser = (userId: string) => {
    const data = AdminUtils.exportUserData(userId)
    if (data) {
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `user-${userId}-data.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      alert("No data found for this user")
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-red-800">Admin Panel</h1>
              <p className="text-red-600">Manage users and application data</p>
            </div>
          </div>

          <div className="bg-red-100 border border-red-300 rounded-lg p-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">
              <strong>Warning:</strong> This panel allows permanent deletion of user data. Use with caution.
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="storage">Storage Info</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Users ({users.length})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button onClick={loadData} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    {selectedUsers.size > 0 && (
                      <Button onClick={handleDeleteSelected} variant="destructive" size="sm" disabled={isLoading}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected ({selectedUsers.size})
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.userId)}
                            onChange={() => toggleUserSelection(user.userId)}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{user.name || "Unknown"}</h3>
                              <Badge variant="outline">{user.email || "Unknown"}</Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{user.predictionsCount} predictions</span>
                              </span>
                              {user.lastActivity && (
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{user.lastActivity.toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button onClick={() => handleExportUser(user.userId)} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.userId)}
                            variant="destructive"
                            size="sm"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5" />
                  <span>Storage Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storageInfo ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800">Total Keys</h3>
                        <p className="text-2xl font-bold text-blue-600">{storageInfo.totalKeys}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800">Total Size</h3>
                        <p className="text-2xl font-bold text-green-600">{storageInfo.totalSize}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Storage Keys</h3>
                      {storageInfo.keys.map((keyInfo: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-mono text-sm">{keyInfo.key}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={keyInfo.type === "predictions" ? "default" : "secondary"}>
                              {keyInfo.type}
                            </Badge>
                            <span className="text-sm text-gray-500">{keyInfo.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading storage information...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Danger Zone</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Clear All Application Data</h3>
                  <p className="text-red-600 text-sm mb-4">
                    This will permanently delete ALL users and their data. This action cannot be undone.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        Type "DELETE ALL DATA" to confirm:
                      </label>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE ALL DATA"
                        className="border-red-300"
                      />
                    </div>

                    <Button
                      onClick={handleClearAllData}
                      variant="destructive"
                      disabled={confirmText !== "DELETE ALL DATA" || isLoading}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
