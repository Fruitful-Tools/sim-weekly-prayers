import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('auth.signedOut'),
        description: t('auth.signedOutSuccess'),
      });
      navigate('/');
    } catch (error) {
      toast({
        title: t('auth.error'),
        description: t('auth.signOutError'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('profile.title')}
          </CardTitle>
          <CardDescription>
            {t('profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.email')}
              </label>
              <p className="text-lg">{user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.userId')}
              </label>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {user.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.status')}
              </label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {user.email_confirmed_at ? t('profile.verified') : t('profile.unverified')}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.joinedAt')}
              </label>
              <p className="text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  {t('profile.permissions')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('profile.permissionsDescription')}
                </p>
                <div className="space-y-2">
                  <Badge variant="outline">
                    {t('profile.canCreatePrayers')}
                  </Badge>
                  <Badge variant="outline">
                    {t('profile.canEditPrayers')}
                  </Badge>
                  <Badge variant="outline">
                    {t('profile.canDeletePrayers')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <Button 
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              {t('auth.signOut')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}