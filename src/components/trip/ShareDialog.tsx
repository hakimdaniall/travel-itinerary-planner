import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { publishTrip, shareUrl } from "@/api/shareApi";
import { useTripStore } from "@/store/tripStore";
import { useTripContext } from "./TripContext";

const ShareDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { trip } = useTripContext();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = trip.shareId ? shareUrl(trip.shareId) : null;

  const publish = async () => {
    setBusy(true);
    try {
      const { id, token } = await publishTrip(trip);
      useTripStore.getState().updateTrip(trip.id, { shareId: id, shareToken: token });
      toast.success(trip.shareId ? "Shared link updated" : "Share link created");
    } catch (error) {
      toast.error("Couldn't create a share link", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this trip</DialogTitle>
          <DialogDescription>
            Anyone with the link can view the itinerary, map and checklist. They can't edit it.
          </DialogDescription>
        </DialogHeader>
        {url ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.target.select()} />
              <Button variant="outline" size="icon" onClick={copy} aria-label="Copy link">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open shared view
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={publish} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update with latest changes
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={publish} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            Create share link
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
