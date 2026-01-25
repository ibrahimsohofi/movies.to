import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, Trash2, Save, Key } from 'lucide-react';
import { toast } from 'sonner';
import MetaTags from '@/components/common/MetaTags';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AvatarUpload from '@/components/common/AvatarUpload';
import ProfileStats from '@/components/common/ProfileStats';
import ActivityFeed from '@/components/common/ActivityFeed';
import Achievements from '@/components/common/Achievements';
import GenrePreferences from '@/components/common/GenrePreferences';
import SocialList from '@/components/common/SocialList';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, deleteAccount, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Profile form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setProfileData(data.user);

      setFormData({
        username: data.user.username || '',
        email: data.user.email || '',
        bio: data.user.bio || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAvatarUpload = async (base64Image) => {
    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: base64Image })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('profile.avatarUpdated'));
        fetchProfile();
      } else {
        toast.error(data.error || t('profile.avatarUploadFailed'));
      }
    } catch (error) {
      toast.error(t('profile.avatarUploadFailed'));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      toast.success(t('profile.profileUpdated'));
      fetchProfile();
    } catch (error) {
      toast.error(error.message || t('profile.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success(t('profile.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || t('profile.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      await deleteAccount();
      toast.success(t('profile.accountDeleted'));
      navigate('/');
    } catch (error) {
      toast.error(error.message || t('profile.accountDeleteFailed'));
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const userInitials = profileData?.username
    ? profileData.username.substring(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <MetaTags
        title={`${profileData?.username || 'User'} - Profile | Movies.to`}
        description="Manage your Movies.to profile settings"
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <AvatarUpload
            currentAvatar={profileData?.avatar_url}
            onUpload={handleAvatarUpload}
          />

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">
              {profileData?.username || 'User Profile'}
            </h1>
            <p className="text-gray-400">{profileData?.email}</p>
            {profileData?.bio && (
              <p className="text-gray-300 mt-2">{profileData.bio}</p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {t('profile.memberSince')} {new Date(profileData?.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {profileData?.stats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{t('profile.stats')}</h2>
            <ProfileStats stats={profileData.stats} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700 grid grid-cols-6 w-full">
            <TabsTrigger value="activity">{t('profile.tabs.activity')}</TabsTrigger>
            <TabsTrigger value="achievements">{t('profile.tabs.achievements')}</TabsTrigger>
            <TabsTrigger value="genres">{t('profile.tabs.genres')}</TabsTrigger>
            <TabsTrigger value="social">{t('profile.tabs.social')}</TabsTrigger>
            <TabsTrigger value="settings">{t('profile.tabs.settings')}</TabsTrigger>
            <TabsTrigger value="security">{t('profile.tabs.security')}</TabsTrigger>
          </TabsList>

          {/* Activity Feed Tab */}
          <TabsContent value="activity" className="mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">{t('profile.recentActivity')}</h2>
            <ActivityFeed />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">{t('profile.achievementsAndBadges')}</h2>
            <Achievements />
          </TabsContent>

          {/* Genre Preferences Tab */}
          <TabsContent value="genres" className="mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">{t('profile.favoriteGenres')}</h2>
            <p className="text-gray-400 mb-6">
              {t('profile.favoriteGenresDescription')}
            </p>
            <GenrePreferences preferences={profileData?.genrePreferences} />
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-6">
            <Tabs defaultValue="followers" className="w-full">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="followers">
                  {t('profile.followers')} ({profileData?.stats?.followerCount || 0})
                </TabsTrigger>
                <TabsTrigger value="following">
                  {t('profile.following')} ({profileData?.stats?.followingCount || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="followers" className="mt-6">
                <SocialList userId={user.id} type="followers" />
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <SocialList userId={user.id} type="following" />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">{t('profile.profileSettings')}</h2>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('auth.username')}
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t('auth.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={t('profile.bioPlaceholder')}
                    className="bg-gray-900 border-gray-700 min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {t('profile.bioCharacterCount', { count: formData.bio.length })}
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('profile.saving') : t('profile.saveChanges')}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  {t('profile.changePassword')}
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? t('profile.changing') : t('profile.changePassword')}
                  </Button>
                </form>
              </div>

              {/* Delete Account */}
              <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-500" />
                  {t('profile.dangerZone')}
                </h2>

                <p className="text-gray-300 mb-6">
                  {t('profile.deleteAccountWarning')}
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('profile.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        {t('profile.deleteAccountConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('profile.deleteAccountConfirmDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('profile.deleteAccount')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
