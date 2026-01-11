import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import * as LucideIcons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Achievements({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      const endpoint = userId
        ? `/api/users/${userId}/achievements`
        : '/api/users/me/achievements';

      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      setAchievements(data.achievements || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Trophy;
    return Icon;
  };

  const categories = {
    viewing: { label: 'Viewing', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    engagement: { label: 'Engagement', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    social: { label: 'Social', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    collection: { label: 'Collection', color: 'text-green-400', bg: 'bg-green-400/10' },
    diversity: { label: 'Diversity', color: 'text-orange-400', bg: 'bg-orange-400/10' }
  };

  const renderAchievement = (achievement) => {
    const Icon = getIcon(achievement.icon);
    const category = categories[achievement.category] || categories.viewing;
    const progress = achievement.progress || 0;
    const requirement = achievement.requirement_value;
    const percentage = Math.min((progress / requirement) * 100, 100);
    const isUnlocked = achievement.unlocked === 1;

    return (
      <Card
        key={achievement.id}
        className={`p-4 ${isUnlocked ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-900/50 border-gray-800 opacity-60'} transition-all hover:scale-105`}
      >
        <div className="flex items-start gap-4">
          <div className={`${category.bg} ${category.color} p-3 rounded-lg relative`}>
            <Icon className="w-6 h-6" />
            {isUnlocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <LucideIcons.Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold">{achievement.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
              </div>
              <Badge variant="outline" className={`${category.color} border-current`}>
                {achievement.points}
              </Badge>
            </div>

            {!isUnlocked && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progress}/{requirement}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )}

            {isUnlocked && achievement.unlocked_at && (
              <p className="text-xs text-gray-500 mt-2">
                Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.unlocked}</p>
              <p className="text-sm text-gray-300 mt-1">Unlocked</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-300">{stats.total - stats.unlocked}</p>
              <p className="text-sm text-gray-400 mt-1">Locked</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{stats.completionPercentage}%</p>
              <p className="text-sm text-gray-300 mt-1">Complete</p>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlocked.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map(renderAchievement)}
          </div>
        </TabsContent>

        <TabsContent value="unlocked" className="mt-6">
          {unlocked.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {unlocked.map(renderAchievement)}
            </div>
          ) : (
            <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
              <LucideIcons.Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No achievements unlocked yet. Keep going!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          {locked.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {locked.map(renderAchievement)}
            </div>
          ) : (
            <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
              <LucideIcons.CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-white">Congratulations! You've unlocked all achievements!</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
