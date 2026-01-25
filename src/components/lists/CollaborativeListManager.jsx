import { useState, useEffect } from 'react';
import { Users, Crown, Shield, Eye, UserPlus, MoreHorizontal, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
  },
  editor: {
    label: 'Editor',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
  },
};

function CollaboratorRow({ collaborator, isOwner, currentUserRole, onRemove, onRoleChange }) {
  const role = collaborator.isOwner ? 'owner' : (collaborator.role || 'viewer');
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  const canManage = isOwner || currentUserRole === 'admin';
  const isPending = collaborator.isPending;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={collaborator.avatar_url} />
          <AvatarFallback>
            {(collaborator.username || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{collaborator.username}</span>
            <Badge
              variant="outline"
              className={cn('gap-1 text-xs', config.bgColor, config.color)}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {isPending && (
              <Badge variant="secondary" className="text-xs">
                Pending
              </Badge>
            )}
          </div>
          {isPending && (
            <p className="text-xs text-muted-foreground">Invitation sent</p>
          )}
        </div>
      </div>

      {canManage && !collaborator.isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <>
                <DropdownMenuItem
                  onClick={() => onRoleChange(collaborator.user_id, 'admin')}
                  disabled={role === 'admin'}
                >
                  <Shield className="h-4 w-4 mr-2 text-purple-500" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRoleChange(collaborator.user_id, 'editor')}
                  disabled={role === 'editor'}
                >
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  Make Editor
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRoleChange(collaborator.user_id, 'viewer')}
                  disabled={role === 'viewer'}
                >
                  <Eye className="h-4 w-4 mr-2 text-gray-500" />
                  Make Viewer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onRemove(collaborator.user_id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function CollaborativeListManager({
  listId,
  isOwner,
  currentUserRole,
  onInvite,
  className,
}) {
  const [collaborators, setCollaborators] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [listId]);

  const fetchCollaborators = async () => {
    try {
      const response = await api.get(`/lists/${listId}/collaborators`);
      setOwner(response.data.owner);
      setCollaborators(response.data.collaborators || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCollaborators();
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this collaborator from the list?')) return;

    try {
      await api.delete(`/lists/${listId}/collaborators/${userId}`);
      setCollaborators(prev => prev.filter(c => c.user_id !== userId));
      toast.success('Collaborator removed');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/lists/${listId}/collaborators/${userId}/role`, { role: newRole });
      setCollaborators(prev =>
        prev.map(c => (c.user_id === userId ? { ...c, role: newRole } : c))
      );
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCollaborators = (owner ? 1 : 0) + collaborators.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              Collaborators
            </CardTitle>
            <CardDescription>
              {totalCollaborators} {totalCollaborators === 1 ? 'person' : 'people'} can access this list
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
            {(isOwner || currentUserRole === 'admin') && (
              <Button onClick={onInvite} size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Owner */}
        {owner && (
          <CollaboratorRow
            collaborator={{ ...owner, isOwner: true }}
            isOwner={isOwner}
            currentUserRole={currentUserRole}
            onRemove={handleRemove}
            onRoleChange={handleRoleChange}
          />
        )}

        {/* Collaborators */}
        {collaborators.map(collaborator => (
          <CollaboratorRow
            key={collaborator.user_id}
            collaborator={collaborator}
            isOwner={isOwner}
            currentUserRole={currentUserRole}
            onRemove={handleRemove}
            onRoleChange={handleRoleChange}
          />
        ))}

        {collaborators.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No collaborators yet</p>
            {(isOwner || currentUserRole === 'admin') && (
              <Button variant="link" onClick={onInvite} className="mt-2">
                Invite someone to collaborate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
