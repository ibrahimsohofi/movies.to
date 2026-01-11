import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Mail,
  AtSign,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  Users,
  Eye,
  Copy,
  Link2,
  Clock,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Timer,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    icon: Eye,
    description: 'Can view the list but cannot make changes',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: Users,
    description: 'Can add and remove movies from the list',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: Shield,
    description: 'Can manage collaborators and edit list settings',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never expires' },
];

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function UserSearchItem({ user, onSelect, isSelected, isAlreadyMember }) {
  return (
    <button
      type="button"
      onClick={() => !isAlreadyMember && onSelect(user)}
      disabled={isAlreadyMember}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isAlreadyMember && 'opacity-50 cursor-not-allowed',
        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback>{(user.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.username}</p>
        {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>
      {isAlreadyMember ? (
        <Badge variant="secondary" className="text-xs">Already member</Badge>
      ) : isSelected ? (
        <Check className="h-4 w-4 text-primary" />
      ) : null}
    </button>
  );
}

function PendingInviteItem({ invite, onCancel, onResend }) {
  const [cancelling, setCancelling] = useState(false);
  const [resending, setResending] = useState(false);
  const roleConfig = ROLES.find((r) => r.value === invite.role) || ROLES[0];
  const RoleIcon = roleConfig.icon;
  const isExpired = new Date(invite.expires_at) < new Date();
  const expiresIn = invite.expires_at
    ? Math.max(0, Math.ceil((new Date(invite.expires_at) - new Date()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border',
      isExpired ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border/50'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={invite.avatar_url} />
          <AvatarFallback className="text-xs">
            {(invite.invitee_username || invite.invitee_email || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{invite.invitee_username || invite.invitee_email}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={cn('text-xs gap-1', roleConfig.bgColor, roleConfig.color)}>
              <RoleIcon className="h-3 w-3" />
              {roleConfig.label}
            </Badge>
            {isExpired ? (
              <Badge variant="destructive" className="text-xs gap-1">
                <XCircle className="h-3 w-3" />Expired
              </Badge>
            ) : expiresIn !== null ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {expiresIn < 24 ? `${expiresIn}h left` : `${Math.ceil(expiresIn / 24)}d left`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isExpired && (
          <Button variant="ghost" size="sm" onClick={async () => { setResending(true); await onResend(invite.id); setResending(false); }} disabled={resending} className="gap-1">
            {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3" />Resend</>}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={async () => { setCancelling(true); await onCancel(invite.id); setCancelling(false); }} disabled={cancelling}>
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function BulkEmailItem({ email, status, onRemove }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-2 py-1 rounded-md text-sm',
      status === 'valid' && 'bg-green-500/10 text-green-600 dark:text-green-400',
      status === 'invalid' && 'bg-destructive/10 text-destructive'
    )}>
      <span className="truncate">{email}</span>
      <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function InviteCollaboratorModal({ isOpen, onClose, listId, listTitle, onInviteSent, existingMembers = [] }) {
  const [activeTab, setActiveTab] = useState('invite');
  const [searchType, setSearchType] = useState('username');
  const [searchValue, setSearchValue] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkExpiration, setLinkExpiration] = useState('7d');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [parsedEmails, setParsedEmails] = useState([]);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [includeMessage, setIncludeMessage] = useState(false);
  const [personalMessage, setPersonalMessage] = useState('');

  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    if (isOpen && activeTab === 'pending') fetchPendingInvites();
  }, [isOpen, activeTab, listId]);

  useEffect(() => {
    if (debouncedSearch.length >= 2 && searchType === 'username') {
      searchUsers(debouncedSearch);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearch, searchType]);

  useEffect(() => {
    if (bulkEmails) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = bulkEmails.match(emailRegex) || [];
      const unique = [...new Set(matches)];
      setParsedEmails(unique.map(email => ({ email, status: email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 'valid' : 'invalid' })));
    } else {
      setParsedEmails([]);
    }
  }, [bulkEmails]);

  const searchUsers = async (query) => {
    setSearching(true);
    try {
      const response = await api.get('/users/search', { params: { q: query, limit: 5 } });
      setSearchResults(response.data.users || []);
      setShowResults(true);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchPendingInvites = async () => {
    setLoadingInvites(true);
    try {
      const response = await api.get(`/lists/${listId}/collaborators/pending`);
      setPendingInvites(response.data.invites || []);
    } catch (err) {
      console.error('Error fetching pending invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const generateInviteLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await api.post(`/lists/${listId}/invite-link`, { role, expiration: linkExpiration });
      setInviteLink(`${window.location.origin}/lists/${listId}?invite=${response.data.token}`);
      toast.success('Invite link generated!');
    } catch (err) {
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const shareInviteLink = async () => {
    if (inviteLink && navigator.share) {
      try {
        await navigator.share({ title: `Join "${listTitle}"`, text: 'You\'ve been invited to collaborate!', url: inviteLink });
      } catch (err) {
        if (err.name !== 'AbortError') copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  const handleSelectUser = (user) => { setSelectedUser(user); setSearchValue(user.username); setShowResults(false); };
  const handleCancelInvite = async (inviteId) => { try { await api.delete(`/lists/${listId}/collaborators/invite/${inviteId}`); setPendingInvites(prev => prev.filter(i => i.id !== inviteId)); toast.success('Cancelled'); } catch { toast.error('Failed'); } };
  const handleResendInvite = async (inviteId) => { try { await api.post(`/lists/${listId}/collaborators/invite/${inviteId}/resend`); toast.success('Resent'); fetchPendingInvites(); } catch { toast.error('Failed'); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!searchValue.trim() && !selectedUser) { setError('Please enter a username or email'); return; }
    setLoading(true); setError(null); setSuccess(false);
    try {
      await api.post(`/lists/${listId}/collaborators/invite`, {
        role,
        message: includeMessage ? personalMessage : undefined,
        ...(selectedUser ? { userId: selectedUser.id } : searchType === 'email' ? { email: searchValue.trim() } : { username: searchValue.trim() }),
      });
      setSuccess(true);
      toast.success(`Invitation sent to ${selectedUser?.username || searchValue}`);
      setTimeout(() => { setSearchValue(''); setSelectedUser(null); setRole('editor'); setSuccess(false); setPersonalMessage(''); setIncludeMessage(false); onInviteSent?.(); }, 1500);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to send invitation';
      setError(message); toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvite = async () => {
    const validEmails = parsedEmails.filter(e => e.status === 'valid').map(e => e.email);
    if (validEmails.length === 0) { toast.error('No valid emails'); return; }
    setSendingBulk(true);
    try {
      const response = await api.post(`/lists/${listId}/collaborators/bulk-invite`, { emails: validEmails, role, message: includeMessage ? personalMessage : undefined });
      const { sent, failed } = response.data;
      if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} sent!`);
      if (failed > 0) toast.error(`${failed} failed`);
      setBulkEmails(''); setParsedEmails([]); setShowBulkInvite(false); onInviteSent?.();
    } catch { toast.error('Failed to send invitations'); } finally { setSendingBulk(false); }
  };

  const handleClose = () => {
    setSearchValue(''); setSelectedUser(null); setRole('editor'); setError(null); setSuccess(false);
    setSearchResults([]); setShowResults(false); setInviteLink(null); setActiveTab('invite');
    setBulkEmails(''); setParsedEmails([]); setShowBulkInvite(false); setPersonalMessage(''); setIncludeMessage(false);
    onClose();
  };

  const selectedRole = ROLES.find(r => r.value === role);
  const isUserAlreadyMember = useCallback((userId) => existingMembers.some(m => m.user_id === userId), [existingMembers]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Invite Collaborator
          </DialogTitle>
          <DialogDescription>Invite someone to collaborate on "{listTitle}"</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invite" className="gap-2"><UserPlus className="h-4 w-4" />Invite</TabsTrigger>
            <TabsTrigger value="link" className="gap-2"><Link2 className="h-4 w-4" />Link</TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />Pending
              {pendingInvites.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{pendingInvites.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="flex-1 overflow-auto mt-4 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium">Bulk Invite</span></div>
                <Switch checked={showBulkInvite} onCheckedChange={setShowBulkInvite} />
              </div>

              {showBulkInvite ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Email Addresses</Label>
                    <Textarea placeholder="Paste emails (comma or newline separated)" value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} className="min-h-[100px]" />
                    <p className="text-xs text-muted-foreground">{parsedEmails.length} email{parsedEmails.length !== 1 ? 's' : ''} detected</p>
                  </div>
                  {parsedEmails.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-auto">
                      {parsedEmails.map(({ email, status }) => (
                        <BulkEmailItem key={email} email={email} status={status} onRemove={() => setParsedEmails(prev => prev.filter(e => e.email !== email))} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button type="button" variant={searchType === 'username' ? 'default' : 'outline'} size="sm" onClick={() => { setSearchType('username'); setSelectedUser(null); setSearchValue(''); }} className="flex-1 gap-2"><AtSign className="h-4 w-4" />Username</Button>
                    <Button type="button" variant={searchType === 'email' ? 'default' : 'outline'} size="sm" onClick={() => { setSearchType('email'); setSelectedUser(null); setSearchValue(''); }} className="flex-1 gap-2"><Mail className="h-4 w-4" />Email</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>{searchType === 'email' ? 'Email Address' : 'Search User'}</Label>
                    <div className="relative">
                      {searchType === 'username' ? <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                      <Input id="search-value" type={searchType === 'email' ? 'email' : 'text'} placeholder={searchType === 'email' ? 'user@example.com' : 'Search by username...'} value={searchValue} onChange={(e) => { setSearchValue(e.target.value); setSelectedUser(null); setError(null); }} className="pl-10" disabled={loading || success} autoComplete="off" />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                        {searchResults.map(user => <UserSearchItem key={user.id} user={user} onSelect={handleSelectUser} isSelected={selectedUser?.id === user.id} isAlreadyMember={isUserAlreadyMember(user.id)} />)}
                      </div>
                    )}
                    {selectedUser && (
                      <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                        <Avatar className="h-6 w-6"><AvatarImage src={selectedUser.avatar_url} /><AvatarFallback className="text-xs">{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-sm font-medium flex-1">{selectedUser.username}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedUser(null); setSearchValue(''); }}><X className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading || success}>
                  <SelectTrigger><SelectValue>{selectedRole && <div className="flex items-center gap-2"><selectedRole.icon className={cn('h-4 w-4', selectedRole.color)} />{selectedRole.label}</div>}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => { const Icon = r.icon; return (<SelectItem key={r.value} value={r.value}><div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', r.color)} /><div><p className="font-medium">{r.label}</p><p className="text-xs text-muted-foreground">{r.description}</p></div></div></SelectItem>); })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label className="cursor-pointer">Include personal message</Label><Switch checked={includeMessage} onCheckedChange={setIncludeMessage} /></div>
                {includeMessage && <Textarea placeholder="Add a personal message..." value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} className="min-h-[80px]" maxLength={500} />}
              </div>

              {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
              {success && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 flex-shrink-0" />Invitation sent successfully!</div>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading || sendingBulk}>Cancel</Button>
                {showBulkInvite ? (
                  <Button type="button" onClick={handleBulkInvite} disabled={sendingBulk || parsedEmails.filter(e => e.status === 'valid').length === 0}>
                    {sendingBulk ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send {parsedEmails.filter(e => e.status === 'valid').length} Invites</>}
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading || success || (!searchValue.trim() && !selectedUser)}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : success ? <><Check className="h-4 w-4 mr-2" />Sent!</> : <><UserPlus className="h-4 w-4 mr-2" />Send Invitation</>}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="link" className="flex-1 overflow-auto mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Anyone with the link can join as</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue>{selectedRole && <div className="flex items-center gap-2"><selectedRole.icon className={cn('h-4 w-4', selectedRole.color)} />{selectedRole.label}</div>}</SelectValue></SelectTrigger>
                  <SelectContent>{ROLES.map(r => { const Icon = r.icon; return <SelectItem key={r.value} value={r.value}><div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', r.color)} />{r.label}</div></SelectItem>; })}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link expiration</Label>
                <Select value={linkExpiration} onValueChange={setLinkExpiration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPIRATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" />{opt.label}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-500">Link generated!</span></div>
                    <div className="flex gap-2">
                      <Input value={inviteLink} readOnly className="text-xs bg-background font-mono" />
                      <Button type="button" variant="outline" size="icon" onClick={copyInviteLink}>{linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={shareInviteLink} className="w-full gap-2"><Share2 className="h-4 w-4" />Share Link</Button>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setInviteLink(null)} className="w-full">Generate New Link</Button>
                </div>
              ) : (
                <Button type="button" onClick={generateInviteLink} disabled={generatingLink} className="w-full gap-2">
                  {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Generate Invite Link
                </Button>
              )}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"><p className="text-xs text-amber-600 dark:text-amber-400">Anyone with this link can join. Share carefully.</p></div>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loadingInvites ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
              ) : pendingInvites.length === 0 ? (
                <div className="text-center py-12"><Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-muted-foreground">No pending invitations</p></div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{pendingInvites.length} pending</span>
                    <Button variant="ghost" size="sm" onClick={fetchPendingInvites} className="gap-1"><RefreshCw className="h-3 w-3" />Refresh</Button>
                  </div>
                  {pendingInvites.map(invite => <PendingInviteItem key={invite.id} invite={invite} onCancel={handleCancelInvite} onResend={handleResendInvite} />)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
