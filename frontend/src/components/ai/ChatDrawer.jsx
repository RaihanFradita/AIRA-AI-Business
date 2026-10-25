import { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import ChatPanel from "./ChatPanel";
import Icon from "../ui/Icon";

export default function ChatDrawer() {
  const { drawer, closeDrawer, send } = useChat();
  useEffect(() => { if (drawer.open && drawer.seed) send(drawer.seed); }, [drawer.open]); // eslint-disable-line
  if (!drawer.open) return null;
  return <div className="fixed inset-0 z-[65]">
    <button className="motion-overlay absolute inset-0 bg-[#02060f]/60 backdrop-blur-sm" onClick={closeDrawer} aria-label="Tutup asisten" />
    <aside role="dialog" aria-label="AIRA Assistant" className="slide-in-right glass-strong absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col shadow-2xl">
      <button onClick={closeDrawer} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary" aria-label="Tutup"><Icon name="close" /></button>
      <ChatPanel compact />
    </aside>
  </div>;
}
