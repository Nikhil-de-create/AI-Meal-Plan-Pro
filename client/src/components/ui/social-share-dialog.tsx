import { useState } from "react";
import { Copy, Share2, Instagram, Facebook, Twitter, MessageCircle, Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareableAchievement {
  type: 'meal_completed' | 'meal_plan_finished' | 'recipe_mastered' | 'cooking_streak';
  title: string;
  description: string;
  imageUrl?: string;
  stats?: {
    cookingTime?: number;
    difficulty?: string;
    calories?: number;
    servings?: number;
  };
}

interface ShareContent {
  text: string;
  hashtags: string[];
  imageCaption: string;
}

interface ShareUrls {
  instagram: {
    copyText: string;
    instructions: string;
  };
  facebook: string;
  twitter: string;
  linkedin: string;
  whatsapp: string;
}

interface SocialShareDialogProps {
  achievement: ShareableAchievement;
  children: React.ReactNode;
  onShare?: (platform: string) => void;
}

export function SocialShareDialog({ achievement, children, onShare }: SocialShareDialogProps) {
  const [shareData, setShareData] = useState<{
    content: ShareContent;
    shareUrls: ShareUrls;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateShareContent = async () => {
    if (shareData) return;
    
    setIsLoading(true);
    try {
      // Generate share content locally without API call for now
      const content = {
        text: `🍳 Just discovered this amazing recipe: ${achievement.title}! ${achievement.description}`,
        hashtags: ['#cooking', '#recipes', '#foodie', '#homecooking', '#delicious'],
        imageCaption: `${achievement.title} - A delicious recipe worth sharing!`
      };

      const baseUrl = window.location.origin;
      const shareText = encodeURIComponent(content.text + ' ' + content.hashtags.join(' '));
      
      const shareUrls = {
        instagram: {
          copyText: content.text + '\n\n' + content.hashtags.join(' '),
          instructions: 'Copy this text and paste it into your Instagram post'
        },
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${shareText}`,
        twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(baseUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}&summary=${shareText}`,
        whatsapp: `https://wa.me/?text=${shareText}`
      };
      
      setShareData({
        content,
        shareUrls
      });
    } catch (error) {
      console.error('Error generating share content:', error);
      toast({
        title: "Error",
        description: "Failed to generate share content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (platform: string, url?: string) => {
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    
    onShare?.(platform);
    
    toast({
      title: "Shared!",
      description: `Recipe shared to ${platform} successfully.`
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild onClick={generateShareContent}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Achievement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Achievement Preview */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <h3 className="font-semibold text-lg">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
            
            {achievement.stats && (
              <div className="flex flex-wrap gap-2 mt-3">
                {achievement.stats.cookingTime && (
                  <Badge variant="secondary">
                    {achievement.stats.cookingTime} mins
                  </Badge>
                )}
                {achievement.stats.difficulty && (
                  <Badge variant="secondary">
                    {achievement.stats.difficulty}
                  </Badge>
                )}
                {achievement.stats.calories && (
                  <Badge variant="secondary">
                    {achievement.stats.calories} cal
                  </Badge>
                )}
                {achievement.stats.servings && (
                  <Badge variant="secondary">
                    {achievement.stats.servings} servings
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Generating share content...</p>
            </div>
          ) : shareData ? (
            <>
              {/* Share Text Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Text:</label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {shareData.content.text}
                </div>
                <div className="flex flex-wrap gap-1">
                  {shareData.content.hashtags.map((tag, index) => (
                    <span key={index} className="text-blue-600 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Social Media Platforms */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Share to:</label>
                
                {/* Instagram */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium">Instagram</p>
                      <p className="text-xs text-muted-foreground">Copy text to post</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      copyToClipboard(shareData.shareUrls.instagram.copyText);
                      handleShare('instagram');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Facebook</p>
                      <p className="text-xs text-muted-foreground">Share to timeline</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare('facebook', shareData.shareUrls.facebook)}
                  >
                    Share
                  </Button>
                </div>

                {/* Twitter */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium">Twitter</p>
                      <p className="text-xs text-muted-foreground">Post to timeline</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare('twitter', shareData.shareUrls.twitter)}
                  >
                    Tweet
                  </Button>
                </div>

                {/* LinkedIn */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <p className="text-xs text-muted-foreground">Share professionally</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare('linkedin', shareData.shareUrls.linkedin)}
                  >
                    Share
                  </Button>
                </div>

                {/* WhatsApp */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Send to contacts</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare('whatsapp', shareData.shareUrls.whatsapp)}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}