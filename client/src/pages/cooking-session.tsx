import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, SkipForward, Square, Timer, ChefHat, ArrowLeft, List, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SocialShareDialog } from "@/components/ui/social-share-dialog";
import { getIngredientIcon, extractIngredientName } from "@/lib/ingredient-icons";

interface CookingStep {
  id: number;
  stepNumber: number;
  description: string;
  durationMinutes?: number;
  durationSeconds?: number;
  isTimerRequired: boolean;
  instructions: string;
}

interface CookingSession {
  id: number;
  recipeId: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStepIndex: number;
  startedAt: string;
  pausedAt?: string;
  totalPausedDuration: number;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

export default function CookingSessionPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<CookingSession | null>(null);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Fetch recipe details
  const { data: recipe, isLoading: recipeLoading } = useQuery<Recipe>({
    queryKey: ['/api/recipes', recipeId],
    enabled: !!recipeId,
  });

  // Fetch cooking steps
  const { data: cookingSteps = [], isLoading: stepsLoading } = useQuery<CookingStep[]>({
    queryKey: [`/api/recipes/${recipeId}/cooking-steps`],
    enabled: !!recipeId,
  });

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (session && session.status === 'active' && isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            toast({
              title: "Step Timer Complete!",
              description: "Time to move to the next step.",
              variant: "default",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session, isTimerActive, timeRemaining, toast]);

  // Initialize timer when session starts or step changes
  useEffect(() => {
    if (session && session.status === 'active' && cookingSteps.length > 0) {
      const currentStep = cookingSteps[session.currentStepIndex];
      if (currentStep && currentStep.isTimerRequired) {
        const totalSeconds = (currentStep.durationMinutes || 0) * 60 + (currentStep.durationSeconds || 0);
        setTimeRemaining(totalSeconds);
        setIsTimerActive(true);
      } else {
        setTimeRemaining(0);
        setIsTimerActive(false);
      }
    }
  }, [session, cookingSteps]);

  // Reset timer when session is paused
  useEffect(() => {
    if (session && session.status === 'paused') {
      setIsTimerActive(false);
    } else if (session && session.status === 'active' && !isTimerActive && cookingSteps.length > 0) {
      const currentStep = cookingSteps[session.currentStepIndex];
      if (currentStep && currentStep.isTimerRequired && timeRemaining === 0) {
        const totalSeconds = (currentStep.durationMinutes || 0) * 60 + (currentStep.durationSeconds || 0);
        setTimeRemaining(totalSeconds);
        setIsTimerActive(true);
      }
    }
  }, [session?.status, cookingSteps, isTimerActive, timeRemaining]);

  // Start cooking session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/cooking-sessions/start/${recipeId}`);
      return response.json();
    },
    onSuccess: (newSession) => {
      setSession(newSession);
      toast({
        title: "Cooking Started!",
        description: "Follow the step-by-step instructions. Timer notifications will guide you through each step.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start cooking session",
        variant: "destructive",
      });
    },
  });

  // Pause session
  const pauseSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/cooking-sessions/${session?.id}/pause`);
      return response.json();
    },
    onSuccess: (updatedSession) => {
      setSession(updatedSession);
      toast({
        title: "Session Paused",
        description: "Your cooking session has been paused. Timers are stopped.",
      });
    },
  });

  // Resume session
  const resumeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/cooking-sessions/${session?.id}/resume`);
      return response.json();
    },
    onSuccess: (updatedSession) => {
      setSession(updatedSession);
      toast({
        title: "Session Resumed",
        description: "Your cooking session has been resumed. Timers are active.",
      });
    },
  });

  // Next step
  const nextStepMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/cooking-sessions/${session?.id}/next-step`);
      return response.json();
    },
    onSuccess: (updatedSession) => {
      setSession(updatedSession);
      if (updatedSession.status === 'completed') {
        toast({
          title: "Cooking Complete!",
          description: "Congratulations! Your meal is ready to enjoy.",
        });
      }
    },
  });

  // Cancel session
  const cancelSessionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/cooking-sessions/${session?.id}`);
    },
    onSuccess: () => {
      setSession(null);
      toast({
        title: "Session Cancelled",
        description: "Your cooking session has been cancelled.",
      });
    },
  });

  const formatDuration = (minutes?: number, seconds?: number): string => {
    const parts: string[] = [];
    if (minutes && minutes > 0) parts.push(`${minutes}m`);
    if (seconds && seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || 'No timer';
  };

  const formatTimeRemaining = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "Time's up!";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentStep = (): CookingStep | null => {
    if (!session || !cookingSteps.length) return null;
    return cookingSteps[session.currentStepIndex] || null;
  };

  const getProgress = (): number => {
    if (!session || !cookingSteps.length) return 0;
    return (session.currentStepIndex / cookingSteps.length) * 100;
  };

  const getSessionStatusColor = () => {
    if (!session) return 'secondary';
    switch (session.status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const currentStep = getCurrentStep();

  if (recipeLoading || stepsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cooking session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recipe not found</h1>
          <Button onClick={() => setLocation('/recipes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => setLocation('/recipes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowAllSteps(!showAllSteps)}
        >
          <List className="w-4 h-4 mr-2" />
          {showAllSteps ? 'Hide' : 'Show'} All Steps
        </Button>
      </div>

      {/* Recipe Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <ChefHat className="w-6 h-6 mr-2" />
                {recipe.name}
              </CardTitle>
              <p className="text-muted-foreground mt-2">{recipe.description}</p>
            </div>
            {session && (
              <Badge variant={getSessionStatusColor()}>
                {session.status === 'active' ? 'Cooking Active' : 
                 session.status === 'paused' ? 'Paused' :
                 session.status === 'completed' ? 'Completed' : 'Cancelled'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              Prep: {recipe.prepTime}min
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              Cook: {recipe.cookTime}min
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {session && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                Step {session.currentStepIndex + 1} of {cookingSteps.length}
              </span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      {session && currentStep && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Step {currentStep.stepNumber}: {currentStep.description}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base mb-4 leading-relaxed">{currentStep.instructions}</p>
            {currentStep.isTimerRequired && (
              <div className={`flex items-center p-3 rounded-lg ${
                isTimerActive && timeRemaining > 0 
                  ? 'bg-blue-50 dark:bg-blue-950' 
                  : timeRemaining === 0 && isTimerActive === false && session?.status === 'active'
                  ? 'bg-green-50 dark:bg-green-950'
                  : 'bg-orange-50 dark:bg-orange-950'
              }`}>
                <Timer className={`w-5 h-5 mr-2 ${
                  isTimerActive && timeRemaining > 0 
                    ? 'text-blue-600' 
                    : timeRemaining === 0 && isTimerActive === false && session?.status === 'active'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`} />
                <span className={`font-medium ${
                  isTimerActive && timeRemaining > 0 
                    ? 'text-blue-800 dark:text-blue-200' 
                    : timeRemaining === 0 && isTimerActive === false && session?.status === 'active'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-orange-800 dark:text-orange-200'
                }`}>
                  {session?.status === 'active' && isTimerActive && timeRemaining > 0 ? (
                    <>Timer: {formatTimeRemaining(timeRemaining)} remaining</>
                  ) : session?.status === 'active' && timeRemaining === 0 && !isTimerActive ? (
                    <>Timer Complete! Time to move to next step</>
                  ) : (
                    <>Timer: {formatDuration(currentStep.durationMinutes, currentStep.durationSeconds)}</>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cooking Completion Celebration */}
      {session && session.status === 'completed' && recipe && (
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
              <ChefHat className="h-8 w-8" />
              Cooking Complete!
            </CardTitle>
            <p className="text-green-600 dark:text-green-400">
              Congratulations! You've successfully prepared {recipe.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation('/recipes')}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Recipes
              </Button>
              
              <SocialShareDialog
                achievement={{
                  type: 'meal_completed',
                  title: recipe.name,
                  description: `Just finished cooking this delicious ${recipe.description}!`,
                  stats: {
                    cookingTime: recipe.prepTime + recipe.cookTime,
                    difficulty: 'Medium',
                    calories: 450,
                    servings: 4
                  }
                }}
                onShare={(platform) => {
                  toast({
                    title: "Shared!",
                    description: `Your cooking achievement has been shared to ${platform}.`
                  });
                }}
              >
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
              </SocialShareDialog>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-green-700 dark:text-green-300">Total Time</div>
                <div className="text-muted-foreground">{recipe.prepTime + recipe.cookTime} mins</div>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-green-700 dark:text-green-300">Steps</div>
                <div className="text-muted-foreground">{cookingSteps.length} completed</div>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-green-700 dark:text-green-300">Achievement</div>
                <div className="text-muted-foreground">Recipe Mastered</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {!session ? (
            <Button 
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending || cookingSteps.length === 0}
              className="w-full"
              size="lg"
            >
              {startSessionMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Cooking Session
            </Button>
          ) : session.status === 'completed' ? (
            <div className="text-center space-y-3">
              <p className="text-lg font-medium text-green-700 dark:text-green-300">
                🎉 Session Complete!
              </p>
              <p className="text-sm text-muted-foreground">
                Your cooking session finished successfully. Great job!
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {session.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => pauseSessionMutation.mutate()}
                    disabled={pauseSessionMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={() => nextStepMutation.mutate()}
                    disabled={nextStepMutation.isPending}
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Next Step
                  </Button>
                </>
              )}
              
              {session.status === 'paused' && (
                <Button
                  onClick={() => resumeSessionMutation.mutate()}
                  disabled={resumeSessionMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              
              <Button
                variant="destructive"
                onClick={() => cancelSessionMutation.mutate()}
                disabled={cancelSessionMutation.isPending}
              >
                <Square className="w-4 h-4 mr-2" />
                Cancel Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Steps Overview */}
      {(showAllSteps || !session) && cookingSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cooking Steps Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cookingSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex items-start p-4 rounded-lg border ${
                    session && index === session.currentStepIndex 
                      ? 'border-primary bg-primary/5' 
                      : session && index < session.currentStepIndex
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-border'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                    session && index === session.currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : session && index < session.currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{step.description}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{step.instructions}</p>
                    {step.isTimerRequired && (
                      <Badge variant="outline" className="text-xs">
                        <Timer className="w-3 h-3 mr-1" />
                        {formatDuration(step.durationMinutes, step.durationSeconds)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}