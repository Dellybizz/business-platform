"use client";
import { FormEvent, useEffect, useState } from "react";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Member = { id: string; userId: string; email: string; displayName: string; role: string };
const editableRoles = ["administrator", "website_editor", "store_manager", "pos_manager", "pos_staff", "support_viewer"] as const;

export function TeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof editableRoles)[number]>("website_editor");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const load = () => fetch("/api/members").then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setMembers(data.members || []);
    setCurrentUserId(data.currentUserId || "");
  }).catch((error) => setMessage(error.message));
  useEffect(() => { load(); }, []);
  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Invitation failed");
    setInviteUrl(`${window.location.origin}${data.inviteUrl}`);
    setEmail("");
    load();
  };
  const changeRole = async (membershipId: string, nextRole: string) => {
    const response = await fetch("/api/members", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ membershipId, role: nextRole }) });
    if (response.ok) load(); else setMessage((await response.json()).error || "Role update failed");
  };
  const remove = async (membershipId: string) => {
    const response = await fetch(`/api/members?membershipId=${encodeURIComponent(membershipId)}`, { method: "DELETE" });
    if (response.ok) load(); else setMessage((await response.json()).error || "Member removal failed");
  };
  return <section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><UserPlus/></span><div><h2>Users and permissions</h2><p>Invite staff and control what they can do in this workspace.</p></div></div><div className="divide-y divide-black/8 border-t border-black/8">{members.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 p-4"><div className="grid size-9 place-items-center rounded-lg bg-[#eef0ec] text-xs font-semibold">{member.displayName.slice(0,2).toUpperCase()}</div><div className="min-w-44 flex-1"><strong className="block text-xs">{member.displayName}</strong><span className="text-[10px] text-black/40">{member.email}</span></div>{member.role === "owner" || member.userId === currentUserId ? <span className="rounded-full bg-[#eef0ec] px-3 py-1 text-[10px] capitalize">{member.role.replace("_", " ")}</span> : <><NativeSelect value={member.role} onChange={(event) => changeRole(member.id, event.target.value)} className="w-40">{editableRoles.map((item) => <NativeSelectOption key={item} value={item}>{item.replace("_", " ")}</NativeSelectOption>)}</NativeSelect><button onClick={() => remove(member.id)} aria-label={`Remove ${member.displayName}`} className="p-2 text-black/35 hover:text-red-600"><Trash2 className="size-4"/></button></>}</div>)}</div><form onSubmit={invite} className="border-t border-black/8 p-4"><div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@example.com"/><NativeSelect value={role} onChange={(event) => setRole(event.target.value as typeof role)}>{editableRoles.map((item) => <NativeSelectOption key={item} value={item}>{item.replace("_", " ")}</NativeSelectOption>)}</NativeSelect><Button className="admin-primary"><UserPlus className="size-4"/>Invite</Button></div>{message && <p className="mt-3 text-xs text-red-600">{message}</p>}{inviteUrl && <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f2f4f0] p-3"><code className="min-w-0 flex-1 truncate text-[10px]">{inviteUrl}</code><button type="button" onClick={() => navigator.clipboard.writeText(inviteUrl)} aria-label="Copy invitation link"><Copy className="size-4"/></button></div>}</form></section>;
}
