import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users, Copy, Check, Film, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function CreateWatchPartyDialog({
  movieId,
  movieTitle,
  posterPath,
  trigger,
  variant = 'default'
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('create'); // 'create' | 'share'
  const [partyData, setPartyData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPublic, setIsPublic] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/watch-party/create', {
        movieId,
        title: title || `${movieTitle} Watch Party`,
        maxParticipants,
        isPublic
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setPartyData(data);
      setStep('share');
      toast.success('Watch party created!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create watch party');
    }
  });

  const handleCreate = () => {
    if (!movieId) {
      toast.error('Movie ID is required');
      return;
    }
    createMutation.mutate();
  };

  const handleCopyCode = () => {
    if (!partyData?.partyCode) return;

    navigator.clipboard.writeText(partyData.partyCode);
    setCopied(true);
    toast.success('Party code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!partyData?.partyCode) return;

    const link = `${window.location.origin}/watch-party/${partyData.partyCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Party link copied!');
  };

  const handleJoinParty = () => {
    if (!partyData?.partyCode) return;
    navigate(`/watch-party/${partyData.partyCode}`);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep('create');
      setPartyData(null);
      setTitle('');
      setMaxParticipants(10);
      setIsPublic(false);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={variant}>
            <Users className="w-4 h-4 mr-2" />
            Watch Party
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-red-500" />
            {step === 'create' ? 'Create Watch Party' : 'Invite Friends'}
          </DialogTitle>
          <DialogDescription>
            {step === 'create'
              ? `Watch "${movieTitle}" together with friends in real-time`
              : 'Share the party code with your friends to join'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'create' ? (
          <div className="space-y-4 py-4">
            {/* Movie Preview */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                  alt={movieTitle}
                  className="w-12 h-18 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-18 rounded bg-muted flex items-center justify-center">
                  <Film className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{movieTitle}</p>
                <p className="text-sm text-muted-foreground">Selected movie</p>
              </div>
            </div>

            {/* Party Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Party Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${movieTitle} Watch Party`}
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Math.max(2, Math.min(50, parseInt(e.target.value) || 10)))}
                min="2"
                max="50"
              />
              <p className="text-xs text-muted-foreground">Between 2 and 50 people</p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic">Public Party</Label>
                <p className="text-xs text-muted-foreground">
                  Allow anyone to discover and join
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Party Code Display */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Share this code with friends:</p>
              <div className="flex items-center gap-2 justify-center">
                <div className="text-4xl font-bold tracking-widest bg-muted px-6 py-3 rounded-lg">
                  {partyData?.partyCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Copy Link Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Invite Link
            </Button>

            {/* Party Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Up to {partyData?.maxParticipants || maxParticipants} participants</p>
              <p>{isPublic ? 'Public party - anyone can join' : 'Private party - code required'}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'create' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Party
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleJoinParty} className="bg-red-600 hover:bg-red-700">
                <Users className="h-4 w-4 mr-2" />
                Join Party
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
