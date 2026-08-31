import {Clock3} from "lucide-react";

export function PhaseDeliveryBadge({phase,label}:{phase:number;label?:string}){
  return <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800" title={`${label||"This component"} is planned for Phase ${phase}`}><Clock3 className="size-3"/>Planned for Phase {phase}</span>;
}
