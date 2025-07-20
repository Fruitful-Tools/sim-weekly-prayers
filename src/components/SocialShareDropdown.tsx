import { useState } from 'react';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface SocialShareDropdownProps {
  url: string;
  title: string;
}

const SocialShareDropdown = ({ url, title }: SocialShareDropdownProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('prayer.linkCopied'),
        description: t('prayer.linkCopiedDesc'),
      });
    } catch (err) {
      toast({
        title: t('prayer.copyFailed'),
        description: t('prayer.copyFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const shareOptions = [
    {
      name: 'Facebook',
      action: () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
      }
    },
    {
      name: 'X (Twitter)',
      action: () => {
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(shareUrl, '_blank');
      }
    },
    {
      name: 'Threads',
      action: () => {
        const shareUrl = `https://threads.net/intent/post?text=${encodeURIComponent(title + ' ' + url)}`;
        window.open(shareUrl, '_blank');
      }
    },
    {
      name: 'Instagram',
      action: () => {
        // Instagram doesn't have direct URL sharing, so we copy the link and tell users to paste
        navigator.clipboard.writeText(url).then(() => {
          toast({
            title: t('share.instagramNote'),
            description: t('share.instagramDesc'),
          });
        });
      }
    },
    {
      name: t('prayer.copyLink'),
      action: handleCopyLink,
      icon: <Copy className="h-4 w-4" />
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {t('share.shareButton')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-lg">
        {shareOptions.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={option.action}
            className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            {option.icon && option.icon}
            {!option.icon && <ExternalLink className="h-4 w-4" />}
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShareDropdown;