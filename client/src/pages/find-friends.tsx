import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, UserPlus, UserMinus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SearchUser {
  id: number;
  username: string;
  email: string;
  isFollowing: boolean;
}

interface FollowUser {
  id: number;
  username: string;
  email: string;
  followedAt: string;
}

export default function FindFriends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  // Get following list
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ['/api/users/following'],
    staleTime: 60000,
  });

  // Get followers list
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['/api/users/followers'],
    staleTime: 60000,
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/users/${userId}/follow`, {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User followed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/discover/friend-activity'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/users/${userId}/follow`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User unfollowed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/discover/friend-activity'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = (user: SearchUser) => {
    if (user.isFollowing) {
      unfollowMutation.mutate(user.id);
    } else {
      followMutation.mutate(user.id);
    }
  };

  const handleUnfollow = (userId: number) => {
    unfollowMutation.mutate(userId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/discover")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Button>
        <h1 className="text-3xl font-bold mb-2">Find Friends</h1>
        <p className="text-muted-foreground">
          Connect with other food enthusiasts and see what they're cooking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery.length >= 2 && (
                <div className="space-y-3">
                  {searchLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user: SearchUser) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleFollowToggle(user)}
                          disabled={followMutation.isPending || unfollowMutation.isPending}
                          variant={user.isFollowing ? "outline" : "default"}
                          size="sm"
                        >
                          {user.isFollowing ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No users found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter at least 2 characters to search for users</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Following/Followers Section */}
        <div className="space-y-6">
          {/* Following */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Following</span>
                <Badge variant="secondary">{following.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : following.length > 0 ? (
                <div className="space-y-3">
                  {following.map((user: FollowUser) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{user.username}</span>
                      </div>
                      <Button
                        onClick={() => handleUnfollow(user.id)}
                        disabled={unfollowMutation.isPending}
                        variant="ghost"
                        size="sm"
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Not following anyone yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Followers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Followers</span>
                <Badge variant="secondary">{followers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : followers.length > 0 ? (
                <div className="space-y-3">
                  {followers.map((user: FollowUser) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{user.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No followers yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}