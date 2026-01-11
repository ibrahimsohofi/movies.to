import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play,
  Pause,
  Users,
  Send,
  LogOut,
  Crown,
  MessageCircle,
  Copy,
  Check,
  Film
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import useStore from '@/store/useStore';

export default function WatchPartyRoom() {
  const { partyCode } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useStore();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Fetch party details
  const { data: party, isLoading, error } = useQuery({
    queryKey: ['watch-party', partyCode],
    queryFn: async () => {
      const response = await api.get(`/watch-party/code/${partyCode}`);
      return response.data.data;
    },
    enabled: !!partyCode,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch messages
  const { data: initialMessages } = useQuery({
    queryKey: ['watch-party-messages', party?.id],
    queryFn: async () => {
      const response = await api.get(`/watch-party/${party.id}/messages`);
      return response.data.data;
    },
    enabled: !!party?.id
  });

  // Join party mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/watch-party/join/${partyCode}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watch-party', partyCode]);
    }
  });

  // Leave party mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/watch-party/${party.id}/leave`);
      return response.data;
    },
    onSuccess: () => {
      navigate('/');
      toast.success('Left the watch party');
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await api.post(`/watch-party/${party.id}/message`, { message });
      return response.data.data;
    }
  });

  // Update playback mutation
  const updatePlaybackMutation = useMutation({
    mutationFn: async ({ currentTime, isPlaying }) => {
      const response = await api.post(`/watch-party/${party.id}/playback`, {
        currentTime,
        isPlaying
      });
      return response.data;
    }
  });

  // Initialize messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join party on mount
  useEffect(() => {
    if (partyCode && user) {
      joinMutation.mutate();
    }
  }, [partyCode, user]);

  // Initialize playback state from party data
  useEffect(() => {
    if (party?.playbackState) {
      setCurrentTime(parseFloat(party.playbackState.current_time) || 0);
      setIsPlaying(!!party.playbackState.is_playing);
    }
  }, [party?.playbackState]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!party?.id || !user) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socketUrl = apiUrl.replace('/api', '');

    socketRef.current = io(socketUrl, {
      path: '/socket.io',
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current.emit('join-watch-party', {
        partyId: party.id,
        userId: user.id
      });
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('playback-sync', ({ currentTime: syncTime, isPlaying: syncPlaying }) => {
      setCurrentTime(syncTime);
      setIsPlaying(syncPlaying);
    });

    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('user-joined', ({ username }) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message_type: 'system',
        message: `${username} joined the party`,
        created_at: new Date().toISOString()
      }]);
      queryClient.invalidateQueries(['watch-party', partyCode]);
    });

    socketRef.current.on('user-left', ({ username }) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message_type: 'system',
        message: `${username} left the party`,
        created_at: new Date().toISOString()
      }]);
      queryClient.invalidateQueries(['watch-party', partyCode]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-watch-party', { partyId: party.id });
        socketRef.current.disconnect();
      }
    };
  }, [party?.id, user]);

  const handlePlayPause = useCallback(() => {
    if (!party) return;

    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    updatePlaybackMutation.mutate({
      currentTime,
      isPlaying: newIsPlaying
    });

    if (socketRef.current?.connected) {
      socketRef.current.emit('playback-update', {
        partyId: party.id,
        currentTime,
        isPlaying: newIsPlaying
      });
    }
  }, [isPlaying, currentTime, party]);

  const handleSeek = useCallback((time) => {
    if (!party) return;

    setCurrentTime(time);

    // Debounce the sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      updatePlaybackMutation.mutate({
        currentTime: time,
        isPlaying
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('playback-update', {
          partyId: party.id,
          currentTime: time,
          isPlaying
        });
      }
    }, 500);
  }, [party, isPlaying]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !party) return;

    sendMessageMutation.mutate(newMessage.trim(), {
      onSuccess: (message) => {
        setMessages(prev => [...prev, message]);
        if (socketRef.current?.connected) {
          socketRef.current.emit('send-message', {
            partyId: party.id,
            message: newMessage.trim()
          });
        }
      }
    });

    setNewMessage('');
  }, [newMessage, party]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(partyCode);
    setCopied(true);
    toast.success('Party code copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [partyCode]);

  const handleLeaveParty = useCallback(() => {
    leaveMutation.mutate();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isHost = party?.host_user_id === user?.id;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video rounded-lg" />
          </div>
          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Party Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This watch party doesn't exist or has ended.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {party.movie_title || 'Watch Party'}
                    <Badge variant={party.status === 'active' ? 'default' : 'secondary'}>
                      {party.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hosted by {party.host_username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">{partyCode}</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLeaveParty}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Leave</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Video Placeholder */}
              <div className="aspect-video bg-black rounded-lg mb-4 relative overflow-hidden">
                {party.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280${party.backdrop_path}`}
                    alt={party.movie_title}
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Film className="h-24 w-24 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full w-16 h-16"
                    onClick={handlePlayPause}
                    disabled={!isHost}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm mb-2 text-center">
                    {isHost ? 'You control the playback' : `${party.host_username} controls the playback`}
                  </p>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlayPause}
                  disabled={!isHost}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={(party.runtime || 120) * 60}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    disabled={!isHost}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-50"
                  />
                </div>
                <span className="text-sm font-mono min-w-[80px] text-right">
                  {formatTime(currentTime)} / {formatTime((party.runtime || 120) * 60)}
                </span>
              </div>

              {!isHost && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only the host can control playback
                </p>
              )}
            </CardContent>
          </Card>

          {/* Movie Info */}
          {party.overview && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{party.overview}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Participants & Chat */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({party.participants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {party.participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {participant.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">{participant.username}</span>
                    {participant.is_host === 1 && (
                      <Crown className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 400px)', minHeight: '300px' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat
                {connected && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={msg.message_type === 'system' ? 'text-center' : ''}
                    >
                      {msg.message_type === 'system' ? (
                        <p className="text-xs text-muted-foreground py-1 px-2 bg-muted/50 rounded inline-block">
                          {msg.message}
                        </p>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={msg.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {msg.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium">{msg.username}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm break-words">{msg.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
