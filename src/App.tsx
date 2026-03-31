import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Search, User, Package, MessageSquare, CheckCircle, List, RefreshCw } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const resetEnv = async (taskId: string) => {
    setLoading(true);
    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      await fetchState();
    } catch (err) {
      console.error('Failed to reset env:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state) setLoading(false);
  }, [state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-8">
      <header className="mb-12 border-b border-zinc-800 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-orange-500 mb-2 uppercase italic">
            Customer Support OpenEnv
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl">
            A real-world environment for AI agents to learn ticket triage, user search, and order resolution.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Active Task</div>
          <div className="text-xl font-bold text-white">{state?.task_id}</div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks & Controls */}
        <section className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <List className="w-4 h-4" /> Available Tasks
            </h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => resetEnv(task.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    state?.task_id === task.id
                      ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                      : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm uppercase tracking-tight">{task.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      task.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                      task.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{task.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Action History
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {state?.history.length === 0 && (
                <div className="text-zinc-600 text-xs italic">No actions taken yet...</div>
              )}
              {state?.history.map((action: any, i: number) => (
                <div key={i} className="text-[11px] font-mono bg-zinc-800/30 p-2 rounded border border-zinc-800/50">
                  <span className="text-orange-500 mr-2">[{i + 1}]</span>
                  <span className="text-zinc-300">{action.type}</span>
                  {action.ticket_id && <span className="text-zinc-500 ml-2">id:{action.ticket_id}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Middle Column: Current View */}
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  View: {state?.current_view}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                ENV_STATE_v1.0
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state?.current_view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {state?.current_view === 'dashboard' && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-zinc-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Welcome to Support Dashboard</h3>
                      <p className="text-zinc-500 max-w-md mx-auto">
                        The agent is currently at the root of the application. Waiting for the first action...
                      </p>
                    </div>
                  )}

                  {state?.current_view === 'tickets_list' && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-orange-500" /> Open Tickets
                      </h3>
                      <div className="grid gap-3">
                        {state?.current_data.map((t: any) => (
                          <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="text-xs text-zinc-500 font-bold mb-1">{t.id}</div>
                              <div className="text-sm font-bold text-zinc-200">{t.subject}</div>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${
                              t.status === 'open' ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-500/20 text-zinc-500'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {state?.current_view === 'ticket_detail' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start border-b border-zinc-800 pb-6">
                        <div>
                          <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">Ticket {state?.current_data.id}</div>
                          <h3 className="text-2xl font-bold text-white">{state?.current_data.subject}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">Status</div>
                          <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold ${
                            state?.current_data.status === 'open' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            {state?.current_data.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {state?.current_data.messages.map((msg: any, i: number) => (
                          <div key={i} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${
                              msg.role === 'agent' 
                                ? 'bg-orange-500 text-white rounded-tr-none' 
                                : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                            }`}>
                              <div className="text-[10px] opacity-60 uppercase font-bold mb-1 tracking-widest">
                                {msg.role}
                              </div>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {state?.current_data.status === 'closed' && (
                        <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl mt-8">
                          <div className="flex items-center gap-3 text-green-500 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-widest text-xs">Resolution Summary</span>
                          </div>
                          <p className="text-sm text-zinc-300 italic">"{state?.current_data.resolution}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {state?.current_view === 'user_search_results' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-orange-500" /> User Search Results
                      </h3>
                      {state?.current_data.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 italic">No users found matching your query.</div>
                      ) : (
                        <div className="grid gap-4">
                          {state?.current_data.map((u: any) => (
                            <div key={u.id} className="bg-zinc-800/50 border border-zinc-700/50 p-6 rounded-xl flex items-center gap-4">
                              <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">{u.id}</div>
                                <div className="text-lg font-bold text-white">{u.name}</div>
                                <div className="text-sm text-zinc-400">{u.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {state?.current_view === 'order_search_results' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-orange-500" /> Order Search Results
                      </h3>
                      {state?.current_data.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 italic">No orders found matching your query.</div>
                      ) : (
                        <div className="grid gap-4">
                          {state?.current_data.map((o: any) => (
                            <div key={o.id} className="bg-zinc-800/50 border border-zinc-700/50 p-6 rounded-xl">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">Order {o.id}</div>
                                  <div className="text-lg font-bold text-white">{o.product}</div>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${
                                  o.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                                  o.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' :
                                  'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                              {o.tracking_number && (
                                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                  <Package className="w-3 h-3" />
                                  <span className="font-bold uppercase tracking-widest opacity-60">Tracking:</span>
                                  <span className="text-zinc-200">{o.tracking_number}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
}
