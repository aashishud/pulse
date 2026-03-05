import { Sparkles } from "lucide-react";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#111214] text-white overflow-x-hidden">
      
      {/* Skeleton Background Element */}
      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-[#0a0a0c]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* Top Nav Skeleton */}
        <div className="flex justify-between items-center mb-8 px-2">
           <div className="flex items-center gap-2 font-bold text-xl tracking-tighter opacity-50">
             <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center animate-pulse"></div>
             <div className="w-16 h-6 bg-zinc-800 rounded-md animate-pulse"></div>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-24 h-9 bg-zinc-800 rounded-xl animate-pulse"></div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Identity Card Skeleton */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 z-20">
            <div className="bg-[#1e1f22]/50 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/5">
              
              {/* Fake Banner */}
              <div className="h-32 bg-zinc-800/80 animate-pulse"></div>
              
              <div className="px-6 pb-6 relative">
                {/* Fake Avatar */}
                <div className="relative -mt-16 mb-4 w-32 h-32">
                  <div className="w-32 h-32 rounded-full border-4 border-[#1e1f22] bg-zinc-800 animate-pulse"></div>
                </div>

                {/* Fake Name & Username */}
                <div className="mb-6 space-y-3">
                  <div className="h-8 w-3/4 bg-zinc-800 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-1/3 bg-zinc-800 rounded-md animate-pulse"></div>
                </div>

                {/* Fake Currently Playing */}
                <div className="mb-6 h-16 w-full bg-zinc-800/50 rounded-xl animate-pulse"></div>
                
                <div className="h-px bg-white/5 my-6"></div>
                
                {/* Fake Social Connections */}
                <div className="space-y-4">
                   <div className="h-3 w-1/3 bg-zinc-800 rounded animate-pulse mb-4"></div>
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse shrink-0"></div>
                       <div className="space-y-2 flex-1">
                         <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse"></div>
                         <div className="h-2 w-1/3 bg-zinc-800 rounded animate-pulse"></div>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Grid Skeleton */}
          <div className="lg:col-span-8">
            
            {/* Fake Tabs */}
            <div className="flex items-center gap-6 px-4 mb-6 border-b border-white/5 pb-4">
               <div className="w-20 h-5 bg-zinc-800 rounded animate-pulse"></div>
               <div className="w-24 h-5 bg-zinc-800/50 rounded animate-pulse"></div>
               <div className="w-16 h-5 bg-zinc-800/50 rounded animate-pulse"></div>
            </div>

            {/* Fake Bento Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Large Hero Card (Full Width) */}
               <div className="col-span-1 md:col-span-2 h-[260px] bg-[#1e1f22]/50 rounded-3xl animate-pulse border border-white/5"></div>
               
               {/* Smaller Half Cards */}
               <div className="col-span-1 h-[160px] bg-[#1e1f22]/50 rounded-3xl animate-pulse border border-white/5"></div>
               <div className="col-span-1 h-[160px] bg-[#1e1f22]/50 rounded-3xl animate-pulse border border-white/5"></div>
               <div className="col-span-1 h-[140px] bg-[#1e1f22]/50 rounded-3xl animate-pulse border border-white/5"></div>
               <div className="col-span-1 h-[140px] bg-[#1e1f22]/50 rounded-3xl animate-pulse border border-white/5"></div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}