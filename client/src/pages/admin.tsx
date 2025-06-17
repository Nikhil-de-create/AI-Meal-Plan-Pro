import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Activity, 
  Settings, 
  ShoppingCart, 
  BarChart3, 
  Search,
  UserPlus,
  Plus,
  Trash2,
  Edit,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalMealPlans: number;
  totalOrders: number;
  recentErrors: number;
}

interface SystemLog {
  id: number;
  level: string;
  message: string;
  source: string;
  createdAt: string;
}

interface AiConfiguration {
  id: number;
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

interface GroceryPartner {
  id: number;
  name: string;
  apiEndpoint: string;
  authToken: string;
  supportedRegions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("analytics");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [userStatus, setUserStatus] = useState("all");

  // Prefetch all admin data on component mount for instant switching
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ["/api/admin/users"] });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/logs"] });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/ai-configs"] });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/grocery-partners"] });
  }, []);

  // Analytics query with prefetching
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SystemAnalytics>({
    queryKey: ["/api/admin/analytics"],
    staleTime: 2 * 60 * 1000, // 2 minutes for analytics
    retry: 1,
  });

  // Users query with filters
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users", userSearch, userRole, userStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userSearch) params.append("search", userSearch);
      if (userRole && userRole !== "all") params.append("role", userRole);
      if (userStatus && userStatus !== "all") params.append("isActive", userStatus);
      
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      return fetch(`/api/admin/users?${params}`, {
        headers,
        credentials: "include",
      }).then(async res => {
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return res.json();
      });
    },
    retry: 1,
  });

  // System logs query
  const { data: systemLogs, isLoading: logsLoading } = useQuery<SystemLog[]>({
    queryKey: ["/api/admin/logs"],
    retry: 1,
  });

  // AI configurations query
  const { data: aiConfigs, isLoading: aiConfigsLoading, refetch: refetchAiConfigs } = useQuery<AiConfiguration[]>({
    queryKey: ["/api/admin/ai-configs"],
    retry: 1,
  });

  // Grocery partners query
  const { data: groceryPartners, isLoading: partnersLoading, refetch: refetchPartners } = useQuery<GroceryPartner[]>({
    queryKey: ["/api/admin/grocery-partners"],
    retry: 1,
  });

  // User management mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/users/${userId}/toggle-status`, {}),
    onSuccess: () => {
      toast({ title: "User status updated successfully" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  // AI configuration mutations
  const createAiConfigMutation = useMutation({
    mutationFn: (data: Partial<AiConfiguration>) => apiRequest("POST", "/api/admin/ai-configs", data),
    onSuccess: () => {
      toast({ title: "AI configuration created successfully" });
      refetchAiConfigs();
    },
    onError: () => {
      toast({ title: "Failed to create AI configuration", variant: "destructive" });
    },
  });

  const deleteAiConfigMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/ai-configs/${id}`),
    onSuccess: () => {
      toast({ title: "AI configuration deleted successfully" });
      refetchAiConfigs();
    },
    onError: () => {
      toast({ title: "Failed to delete AI configuration", variant: "destructive" });
    },
  });

  // Grocery partner mutations
  const createPartnerMutation = useMutation({
    mutationFn: (data: Partial<GroceryPartner>) => apiRequest("POST", "/api/admin/grocery-partners", data),
    onSuccess: () => {
      toast({ title: "Grocery partner created successfully" });
      refetchPartners();
    },
    onError: () => {
      toast({ title: "Failed to create grocery partner", variant: "destructive" });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/grocery-partners/${id}`),
    onSuccess: () => {
      toast({ title: "Grocery partner deleted successfully" });
      refetchPartners();
    },
    onError: () => {
      toast({ title: "Failed to delete grocery partner", variant: "destructive" });
    },
  });

  // Analytics Cards Component
  const AnalyticsCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            +5% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meal Plans</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalMealPlans || 0}</div>
          <p className="text-xs text-muted-foreground">
            +18% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
          <p className="text-xs text-muted-foreground">
            +8% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Errors</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.recentErrors || 0}</div>
          <p className="text-xs text-muted-foreground">
            -23% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // User Management Component
  const UserManagement = () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={userRole} onValueChange={setUserRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userStatus} onValueChange={setUserStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage system users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : !users || !Array.isArray(users) ? (
            <div className="text-center py-4 text-muted-foreground">
              No users found or failed to load users
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatusMutation.mutate(user.id)}
                      disabled={toggleUserStatusMutation.isPending}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // System Logs Component
  const SystemLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>Recent system activity and error logs</CardDescription>
      </CardHeader>
      <CardContent>
        {logsLoading ? (
          <div className="text-center py-4">Loading logs...</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {systemLogs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  log.level === 'error' ? 'bg-red-500' : 
                  log.level === 'warning' ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.level}</Badge>
                    <Badge variant="secondary">{log.source}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // AI Configuration Form
  const [newAiConfig, setNewAiConfig] = useState({
    name: "",
    provider: "",
    model: "",
    apiKey: "",
    isActive: true
  });

  const AiConfigurationForm = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add AI Configuration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add AI Configuration</DialogTitle>
          <DialogDescription>
            Configure a new AI provider for meal plan generation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={newAiConfig.name}
              onChange={(e) => setNewAiConfig({...newAiConfig, name: e.target.value})}
              placeholder="OpenAI GPT-4"
            />
          </div>
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select value={newAiConfig.provider} onValueChange={(value) => setNewAiConfig({...newAiConfig, provider: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={newAiConfig.model}
              onChange={(e) => setNewAiConfig({...newAiConfig, model: e.target.value})}
              placeholder="gpt-4"
            />
          </div>
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={newAiConfig.apiKey}
              onChange={(e) => setNewAiConfig({...newAiConfig, apiKey: e.target.value})}
              placeholder="sk-..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={newAiConfig.isActive}
              onCheckedChange={(checked) => setNewAiConfig({...newAiConfig, isActive: checked})}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <Button 
            onClick={() => {
              createAiConfigMutation.mutate(newAiConfig);
              setNewAiConfig({ name: "", provider: "", model: "", apiKey: "", isActive: true });
            }}
            disabled={createAiConfigMutation.isPending}
          >
            Create Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // AI Configurations Component
  const AiConfigurations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">AI Configurations</h3>
          <p className="text-sm text-muted-foreground">
            Manage AI providers and their settings
          </p>
        </div>
        <AiConfigurationForm />
      </div>
      
      <Card>
        <CardContent className="p-0">
          {aiConfigsLoading ? (
            <div className="text-center py-8">Loading AI configurations...</div>
          ) : (
            <div className="divide-y">
              {aiConfigs?.map((config) => (
                <div key={config.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.name}</h4>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.provider} • {config.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(config.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteAiConfigMutation.mutate(config.id)}
                        disabled={deleteAiConfigMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Grocery Partner Form
  const [newPartner, setNewPartner] = useState({
    name: "",
    apiEndpoint: "",
    authToken: "",
    supportedRegions: [] as string[],
    isActive: true
  });

  const GroceryPartnerForm = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Grocery Partner
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Grocery Partner</DialogTitle>
          <DialogDescription>
            Configure a new grocery delivery partner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="partnerName">Partner Name</Label>
            <Input
              id="partnerName"
              value={newPartner.name}
              onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
              placeholder="Instacart"
            />
          </div>
          <div>
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input
              id="apiEndpoint"
              value={newPartner.apiEndpoint}
              onChange={(e) => setNewPartner({...newPartner, apiEndpoint: e.target.value})}
              placeholder="https://api.partner.com/v1"
            />
          </div>
          <div>
            <Label htmlFor="authToken">Auth Token</Label>
            <Input
              id="authToken"
              type="password"
              value={newPartner.authToken}
              onChange={(e) => setNewPartner({...newPartner, authToken: e.target.value})}
              placeholder="Bearer token or API key"
            />
          </div>
          <div>
            <Label htmlFor="regions">Supported Regions (comma-separated)</Label>
            <Input
              id="regions"
              value={newPartner.supportedRegions.join(", ")}
              onChange={(e) => setNewPartner({...newPartner, supportedRegions: e.target.value.split(", ").filter(Boolean)})}
              placeholder="US, CA, UK"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="partnerActive"
              checked={newPartner.isActive}
              onCheckedChange={(checked) => setNewPartner({...newPartner, isActive: checked})}
            />
            <Label htmlFor="partnerActive">Active</Label>
          </div>
          <Button 
            onClick={() => {
              createPartnerMutation.mutate(newPartner);
              setNewPartner({ name: "", apiEndpoint: "", authToken: "", supportedRegions: [], isActive: true });
            }}
            disabled={createPartnerMutation.isPending}
          >
            Create Partner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Grocery Partners Component
  const GroceryPartners = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Grocery Partners</h3>
          <p className="text-sm text-muted-foreground">
            Manage grocery delivery integrations
          </p>
        </div>
        <GroceryPartnerForm />
      </div>
      
      <Card>
        <CardContent className="p-0">
          {partnersLoading ? (
            <div className="text-center py-8">Loading grocery partners...</div>
          ) : (
            <div className="divide-y">
              {groceryPartners?.map((partner) => (
                <div key={partner.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{partner.name}</h4>
                        <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                          {partner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {partner.apiEndpoint}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Regions: {partner.supportedRegions.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(partner.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deletePartnerMutation.mutate(partner.id)}
                        disabled={deletePartnerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, monitor system health, and configure services
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Super Admin Access
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="ai-config">AI Config</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : (
            <AnalyticsCards />
          )}
          <SystemLogs />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs />
        </TabsContent>

        <TabsContent value="ai-config">
          <AiConfigurations />
        </TabsContent>

        <TabsContent value="partners">
          <GroceryPartners />
        </TabsContent>
      </Tabs>
    </div>
  );
}