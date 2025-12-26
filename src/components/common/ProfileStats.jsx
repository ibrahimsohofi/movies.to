import { Film, Star, MessageSquare, Eye, Users, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ProfileStats({ stats }) {
  const statItems = [
    {
      label: 'Movies Watched',
      value: stats?.viewCount || 0,
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      label: 'Watchlist',
      value: stats?.watchlistCount || 0,
      icon: Film,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    },
    {
      label: 'Reviews',
      value: stats?.reviewCount || 0,
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      label: 'Comments',
      value: stats?.commentCount || 0,
      icon: MessageSquare,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      label: 'Followers',
      value: stats?.followerCount || 0,
      icon: Users,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10'
    },
    {
      label: 'Following',
      value: stats?.followingCount || 0,
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10'
    },
    {
      label: 'Achievements',
      value: stats?.unlockedAchievements || 0,
      icon: Trophy,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10'
    },
    {
      label: 'Total Points',
      value: stats?.totalPoints || 0,
      icon: Trophy,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`${item.bgColor} ${item.color} p-3 rounded-lg`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-sm text-gray-400">{item.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
