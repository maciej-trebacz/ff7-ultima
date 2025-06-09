import { Modal } from "@/components/Modal";
import { version } from "../../../src-tauri/tauri.conf.json";

interface AboutModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AboutModal({ isOpen, setIsOpen }: AboutModalProps) {
  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="FF7 Ultima"
      size="sm"
      callback={() => {}}
    >
      <div className="space-y-2">
        <p>The Final Fantasy VII real-time game editor, trainer and hacking tool.</p>
        <p>&copy; 2024-2025 Maciej Trebacz (mav)</p>
        <p><a target="_blank" className="text-slate-400 hover:text-slate-200" href="https://github.com/maciej-trebacz/ff7-ultima">Source code on GitHub</a></p>
        <p><a target="_blank" className="text-slate-400 hover:text-slate-200" href="https://twitch.tv/m4v3k">Watch me code this app live on Twitch</a></p>
        <br />
        <p><b>Acknowledgments:</b></p>
        <p>DLPB - author of Ochu app, list of battle formations</p>
        <p>Phantasm - testing and ideas</p>
        <p>petfriendamy - list of game moments</p>
        <p>picklejar76 - for the extracted scene.bin data</p>
        <p>myst6re, NFITC1 - authors of invaluable FF7 tools</p>
        <p>FF7 Wiki authors - savemap and other game data</p>
        <p>... and the whole Qhimm and FF7 community.</p>
      </div>
    </Modal>
  );
}
